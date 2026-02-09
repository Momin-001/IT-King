import { type Request, type Response } from "express";
import { prisma } from "../config/prisma.js";
import bcrypt from "bcryptjs";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    // Fetch both lists in parallel for better performance
    const [verifiedUsers, unverifiedUsers] = await Promise.all([
      prisma.user.findMany({
        where: { isAdmin: false },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          isAdmin: true,
        },
        orderBy: { id: "desc" },
      }),
      prisma.unverifiedUser.findMany({
        select: {
          id: true,
          email: true,
          expiresIn: true,
          link: true,
        },
        orderBy: { id: "desc" },
      }),
    ]);

    // Format and Send the response
    res.status(200).json({
      status: "success",
      totalCount: verifiedUsers.length + unverifiedUsers.length,
      data: {
        verified: verifiedUsers,
        unverified: unverifiedUsers,
      },
    });
  } catch (error) {
    console.error("Fetch All Users Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getVerifiedUsers = async (req: Request, res: Response) => {
  try {
    const { projectId, teamId, unAssigned } = req.query;

    // Dynamic filter creation
    const filter: any = {
      isAdmin: false,
      isActive: true, // only get active users
    };

    // If looking for a user that is not in a team(for admin transfer)
    if (unAssigned && unAssigned === "true") {
      filter.teams = {
        none: {}, // "none" filter checks for empty relations
      };
      filter.ledTeam = { is: null }; // ensure they aren't leading a team(unnecessary since having no teams is enough, but precaution)
    }
    // If user can be a team member
    else {
      if (projectId) {
        filter.teams = {
          some: {
            projects: {
              some: { id: parseInt(projectId as string) },
            },
          },
        };
      }
      if (teamId) {
        filter.teams = {
          some: { id: parseInt(teamId as string) },
        };
      }
    }

    const verifiedUsers = await prisma.user.findMany({
      where: filter,
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        ledTeam: true,
        teams: true,
      },
      orderBy: { id: "desc" },
    });

    // Format and Send the response
    res.status(200).json({
      status: "success",
      totalCount: verifiedUsers.length,
      users: verifiedUsers,
    });
  } catch (error) {
    console.error("Fetch All Users Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    // Validation
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthenticated Request" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        teams: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    console.error("Get Me Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getLedTeamId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Validate
    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ message: "Invalid User ID" });
    }

    const parsedId = parseInt(userId);

    // Querying the Team table directly is faster than querying the User and including the team
    const team = await prisma.team.findFirst({
      where: { teamLeadId: parsedId },
      select: { id: true },
    });

    // If team is null, it means the user is not a lead
    res.status(200).json({
      status: "success",
      teamId: team ? team.id : null,
      isLead: !!team,
    });
  } catch (error) {
    console.error("Get Led Team Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const toggleUserActivation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;

    // Validation
    if (!adminId) {
      return res.status(401).json({ message: "Unauthenticated Request" });
    }
    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Invalid User ID" }); // target ID not provided
    }

    // Self-deactivation check, since self is admin
    if (parseInt(id) === adminId) {
      return res
        .status(400)
        .json({ message: "You cannot deactivate your own account." });
    }

    // Find user and check role
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: { ledTeam: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Prevent deactivating other Admins. In case more admins are added
    if (user.isAdmin) {
      return res.status(403).json({
        message: "Cannot deactivate an Admin account.",
      });
    }

    if (user.ledTeam) {
      return res
        .status(400)
        .json({ message: "You cannot deactivate a Team Lead." });
    }

    const newStatus = !user.isActive;
    // Update status
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isActive: newStatus },
      select: { id: true, email: true, isActive: true }, // returning de-activated user just in case needed by frontend
    });

    res.status(200).json({
      status: "success",
      message: `User ${updatedUser.email} has been ${newStatus === true ? "activated" : "deactivated"}.`,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Deactivate User Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateName = async (req: Request, res: Response) => {
  const userId = req?.user?.id;

  // validation
  if (!userId) {
    return res.status(401).json({ message: "Unauthenticated request/" });
  }

  const { name } = req.body;
  await prisma.user.update({
    where: { id: userId },
    data: { name },
  });
  res.status(200).json({ message: "Name updated" });
};

export const updatePassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req?.user?.id;

  // validation
  if (!userId) {
    return res.status(401).json({ message: "Unauthenticated request/" });
  }

  // Verifying current password
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(400).json({ message: "Invalid User ID." });

  const isMatch = await bcrypt.compare(currentPassword, user?.password);
  if (!isMatch)
    return res.status(401).json({ message: "Incorrect current password" });

  // Hash and save new password
  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });

  res.status(200).json({ message: "Password updated" });
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    // If id not sent in params
    return res.status(400).json({
      message: "Id is required for deletion",
    });
  }

  try {
    // Find the user first to check their role
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: { ledTeam: true },
    });

    // Check if user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent deletion if the target is an Admin
    if (user.isAdmin) {
      return res.status(403).json({
        message: "Action denied: Admin accounts cannot be deleted",
      });
    }

    if (user.ledTeam) {
      return res
        .status(400)
        .json({ message: "You cannot delete a Team Lead." });
    }

    // Performing the deletion
    await prisma.user.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({
      status: "success",
      message: `User with email ${user.email} has been deleted.`,
    });
  } catch (error: any) {
    console.error("Delete User Error:", error);

    // Check for Prisma dependency errors (e.g., user has existing tasks/messages)
    if (error.code === "P2003") {
      return res.status(400).json({
        message:
          "Cannot delete user: This user is linked to existing teams or tasks.",
      });
    }

    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const transferAdmin = async (req: Request, res: Response) => {
  try {
    const { newAdminId } = req.body;
    const currentAdminId = req.user?.id;

    // Validation
    if (!newAdminId) {
      return res.status(400).json({ message: "New Admin ID is required." });
    }
    if (!currentAdminId) {
      return res.status(401).json({ message: "Unauthenticated request." });
    }

    const nAId = parseInt(newAdminId);

    // Verify the current user is actually the Admin
    const currentAdmin = await prisma.user.findUnique({
      where: { id: currentAdminId },
    });

    if (!currentAdmin || !currentAdmin.isAdmin) {
      return res
        .status(403)
        .json({ message: "Only the Admin can transfer ownership." });
    }

    // getting new admin to know if he is a team lead/member
    const newAdmin = await prisma.user.findUnique({
      where: { id: nAId },
      include: {
        _count: {
          select: {
            teams: true,
          },
        },
        ledTeam: true,
      },
    });

    // If new admin is a team lead, do not allow
    if (newAdmin?.ledTeam) {
      return res.status(400).json({ message: "A Team Lead can not be Admin." });
    }
    // If new admin is a team member, do not allow
    if (newAdmin?._count?.teams && newAdmin?._count?.teams > 0) {
      return res
        .status(400)
        .json({ message: "A Team Member can not be Admin." });
    }

    // Performing the swap in a transaction
    await prisma.$transaction(async (tx) => {
      // Downgrade current admin
      await tx.user.update({
        where: { id: currentAdminId },
        data: { isAdmin: false },
      });

      // Upgrade new admin
      await tx.user.update({
        where: { id: nAId },
        data: { isAdmin: true },
      });
    });

    res.status(200).json({
      status: "success",
      message: "Ownership transferred successfully. Please login again.",
    });
  } catch (error: any) {
    console.error("Transfer Admin Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
