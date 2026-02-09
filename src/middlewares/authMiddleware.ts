import jwt, { type JwtPayload } from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import type { NextFunction, Request, Response } from "express";
import { JWT_SECRET } from "../controllers/authController.js";

export async function protect(req: Request, res: Response, next: NextFunction) {
  let token;

  if (req.headers?.authorization?.startsWith("Bearer")) {
    token = req.headers?.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Prisma lookup
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    req.user = { id: user.id, isAdmin: user.isAdmin };
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
}

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  // Check if user object exists on request (set by previous auth middleware) and user is admin
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    return res.status(403).json({
      message: "Access denied: This resource requires Admins privileges.",
    });
  }
};

export const isAdminOrLead = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = req.user;

  if(!user){
    return res
    .status(401)
    .json({ message: "Unauthenticated request" });
  }

  const isLead = await prisma.team.findFirst({
    where: { teamLeadId: user?.id },
  });

  if (user?.isAdmin || isLead) {
    return next();
  }

  return res
    .status(403)
    .json({ message: "Requires Admin or Team Lead status" });
};
