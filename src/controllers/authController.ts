import { type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import crypto from "crypto";
import { isAdmin } from "../middlewares/authMiddleware.js";
import { sendEmail } from "../utils/sendEmail.js";
import { verificationTemplate } from "../utils/emailTemplates.js";

export const JWT_SECRET: string =
  process.env.JWT_SECRET ?? "4So07wbqQJtY8FPcoqnLvOnN4VgObfBy11yAEu5WQDk";
export const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ??
  "SXZVg8jYl6veTbtlXy6bP9WoewMcqfgtXHaABHtgWMS";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: "Account Deactivated by Admin" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Send tokens
    const accessToken = jwt.sign(
      { id: user.id, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: "15m" },
    );

    const refreshToken = jwt.sign(
      { id: user.id, isAdmin: user.isAdmin },
      JWT_REFRESH_SECRET,
      {
        expiresIn: "7d",
      },
    );

    // Extracting password so it does not get sent to frontend
    const { password: _, ...userWithoutPassword } = user;

    console.log("Login Data: ", userWithoutPassword);

    res.status(200).json({
      status: "success",
      accessToken,
      refreshToken,
      user: {
        id: userWithoutPassword.id,
        isAdmin: userWithoutPassword.isAdmin,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh Token is required" });
    }

    // Verify the token signature
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as JwtPayload;

    // Verify account is still active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, isAdmin: true, isActive: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User no longer exists" });
    }

    if (!user.isActive) {
      return res
        .status(403)
        .json({ message: "User account has been deactivated" });
    }

    // Issue new Access Token
    const accessToken = jwt.sign(
      { id: user.id, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: "15m" },
    );

    res.status(200).json({ status: "success", accessToken });
  } catch (error) {
    // If token is expired or tampered
    return res
      .status(403)
      .json({ message: "Invalid or expired refresh token" });
  }
};

export const createUnverifiedUser = async (req: Request, res: Response) => {
  //TODO: use nodemailer to send mail
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if user is already fully registered in the User table
    const existingVerifiedUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingVerifiedUser) {
      return res
        .status(400)
        .json({ message: "User already exists and is verified." });
    }

    // Generate a unique random string for the link (hex)
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Set expiration to 24 hours from now
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 24);

    // Create or Update (upsert) the unverified user record so if they request a new link, it updates the existing record
    const unverifiedUser = await prisma.unverifiedUser.upsert({
      where: { email },
      update: {
        link: verificationToken,
        expiresIn: expirationDate,
      },
      create: {
        email,
        link: verificationToken,
        expiresIn: expirationDate,
      },
    });

    // Construct the full URL
    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
    const verificationUrl = `${frontendUrl}/verify-user/${verificationToken}`;
    console.log(`Verify Link: ${verificationUrl}`);

    // sending the link via an email using Nodemailer.
    sendEmail({
      email,
      subject: "Verify Account",
      message: `Account verification link: ${verificationUrl}`,
      html: verificationTemplate(email, verificationUrl),
    });

    // returning the link in the response for testing.
    res.status(201).json({
      status: "success",
      message: "Verification link generated.",
      data: {
        email: unverifiedUser.email,
        verificationLink: verificationUrl, // Send this via email in production
        expiresAt: unverifiedUser.expiresIn,
      },
    });
  } catch (error) {
    console.error("Error in authController/createUnverifiedUser:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getUnverifiedUserData = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token || typeof token !== "string") {
      // if token was not given with the request
      return res.status(400).json({
        message: "Invalid verification link.",
      });
    }

    // Find the unverifiedUser by the unique link/token
    const unverifiedUser = await prisma.unverifiedUser.findFirst({
      where: { link: token },
    });

    // If token doesn't exist in DB
    if (!unverifiedUser) {
      return res.status(404).json({
        message: "Invalid verification link. Please request a new one.",
      });
    }

    // Check if the link has expired
    const currentTime = new Date();
    if (currentTime > unverifiedUser.expiresIn) {
      // delete expired token from DB
      await prisma.unverifiedUser.delete({ where: { id: unverifiedUser.id } });

      return res.status(410).json({
        message: "This link has expired. Please register again.",
      });
    }

    // Return the email to the frontend
    res.status(200).json({
      status: "success",
      data: {
        email: unverifiedUser.email,
        expiresAt: unverifiedUser.expiresIn,
      },
    });
  } catch (error) {
    console.error("Error in authController/getUnverifiedUserData:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const completeVerification = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { name, password } = req.body;

    // Validation
    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Invalid Link" });
    }
    if (!name || !password) {
      return res
        .status(400)
        .json({ message: "Name and password are required." });
    }

    // Find the UnverifiedUser record
    const unverifiedUser = await prisma.unverifiedUser.findFirst({
      where: { link: token },
    });

    // If link was not found in DB
    if (!unverifiedUser) {
      return res
        .status(404)
        .json({ message: "Invalid or expired verification link." });
    }

    // Check expiration
    if (new Date() > unverifiedUser.expiresIn) {
      // If expired
      await prisma.unverifiedUser.delete({ where: { id: unverifiedUser.id } }); // delete record
      return res
        .status(410)
        .json({ message: "Link has expired. Please register again." });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User and Delete Unverified record(using transaction)
    const newUser = await prisma.$transaction(async (tx) => {
      // Create the verified User
      const user = await tx.user.create({
        data: {
          name,
          email: unverifiedUser.email,
          password: hashedPassword,
          isAdmin: false, // default is non-admin
        },
      });

      // Delete from unverified table
      await tx.unverifiedUser.delete({
        where: { id: unverifiedUser.id },
      });

      return user;
    });

    // Return success (excluding password)
    res.status(201).json({
      status: "success",
      message: "Account verified and created successfully!",
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error: any) {
    console.error("Verification Completion Error:", error);

    // If user already verified
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({ message: "A user with this email already exists." });
    }

    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteUnverifiedUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
      // if  was not given with the request
      return res.status(400).json({
        message: "ID required.",
      });
    }

    // Check if the record exists
    const unverifiedUser = await prisma.unverifiedUser.findUnique({
      where: { id: parseInt(id) },
    });

    if (!unverifiedUser) {
      return res
        .status(404)
        .json({ message: "Unverified user record not found." });
    }

    // Perform the deletion
    await prisma.unverifiedUser.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({
      status: "success",
      message: `Invitation for ${unverifiedUser.email} has been revoked and deleted.`,
    });
  } catch (error) {
    console.error("Delete Unverified User Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
