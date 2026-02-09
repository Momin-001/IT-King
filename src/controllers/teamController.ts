import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";

export const getAllTeams = async (req: Request, res: Response) => {
  const id = req.user?.id;
  const isAdmin = req.user?.isAdmin;

  if (!id) return res.status(401).json({ message: "Unauthenticated request." });

  const filter = isAdmin ? {} : { users: { some: { id: id } } };

  try {
    const teams = await prisma.team.findMany({
      where: filter,
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: {
            users: true,
            projects: true,
          },
        },
      },
    });

    // Formatting the data for the frontend
    const formattedTeams = teams.map((team) => ({
      id: team.id,
      name: team.name,
      description: team.description,
      membersCount: team._count.users,
      projectsCount: team._count.projects,
    }));

    res.status(200).json({ status: "success", data: formattedTeams });
  } catch (error) {
    console.error("Get All Teams Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createTeam = async (req: Request, res: Response) => {
  try {
    const { name, description, teamLeadId } = req.body;
    const leadId = parseInt(teamLeadId);

    if (!name || !teamLeadId) {
      return res
        .status(400)
        .json({ message: "Team name and Team Lead ID are required" });
    }

    // Using a DB transaction
    const newTeam = await prisma.$transaction(async (tx) => {
      // Getting admin so it can be added to the chat
      const admin = await tx.user.findFirst({
        where: { isAdmin: true, isActive: true },
        select: { id: true },
      });

      // Create the Team and Chat
      const team = await tx.team.create({
        data: {
          name,
          teamLeadId: leadId,
          description: description,
          chat: {
            create: {}, // Creates the associated Chat
          },
          users: {
            connect: [{ id: leadId }, { id: admin!.id }], // adding teamLead and admin
          },
        },
        include: { chat: true },
      });

      // Creating the UserChatState for the Team Lead
      await tx.userChatState.create({
        data: {
          userId: leadId,
          chatId: team.chat!.id,
          // joinedAt defaults to now()
        },
      });

      // Creating Chat State for Admin
      await tx.userChatState.create({
        data: {
          userId: admin!.id,
          chatId: team.chat!.id,
        },
      });

      return team;
    });

    res.status(201).json({ status: "success", data: newTeam });
  } catch (error: any) {
    if (error.code === "P2014" || error.code === "P2002") {
      return res
        .status(400)
        .json({ message: "This user is already leading another team." });
    }
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const addMemberToTeam = async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const { userId } = req.body;

    if (!teamId || typeof teamId !== "string") {
      return res.status(400).json({ message: "Team ID is required" });
    }

    const updatedTeam = await prisma.$transaction(async (tx) => {
      // Update the team to connect the user
      const team = await tx.team.update({
        where: { id: parseInt(teamId) },
        data: {
          users: {
            connect: { id: parseInt(userId) },
          },
        },
        include: {
          chat: { select: { id: true } }, // We need the chatId to create the state
        },
      });

      // Create the UserChatState for the new member. This is what makes the chat appear in their sidebar
      await tx.userChatState.create({
        data: {
          userId: parseInt(userId),
          chatId: team.chat!.id,
          // joinedAt defaults to 'now', protecting their privacy from past messages
        },
      });

      return team;
    });

    res.status(200).json({ status: "success", data: updatedTeam });
  } catch (error: any) {
    console.log(`Error in teamControlller/addMemberToTeam: `, error);
    res.status(500).json({ message: "Could not add member to team." });
  }
};

export const getTeamDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Team ID is required" });
    }

    const team = await prisma.team.findUnique({
      where: { id: parseInt(id) },
      include: {
        TeamLead: { select: { id: true, name: true, email: true } },
        users: { select: { id: true, name: true, email: true } },
        projects: true,
        chat: true,
      },
    });

    if (!team) return res.status(404).json({ message: "Team not found" });

    res.status(200).json({ status: "success", data: team });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const removeMember = async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const { userId } = req.body;

    // validation
    if (
      !teamId ||
      !userId ||
      typeof teamId !== "string" ||
      typeof userId !== "string"
    ) {
      return res.status(400).json({ message: "Team ID and User ID required" });
    }

    const uId = parseInt(userId);
    const tId = parseInt(teamId);

    // more Validation
    if (req.user?.isAdmin && uId === req.user?.id) {
      return res.status(400).json({ message: "Admin can not be removed." });
    }

    // Fetch the team and check the Team Lead
    const team = await prisma.team.findUnique({
      where: { id: tId },
      select: {
        teamLeadId: true,
        chat: { select: { id: true } }, // We need the chatId to remove the state
        projects: { select: { id: true } },
      },
    });

    if (!team) return res.status(404).json({ message: "Team not found" });

    if (team.teamLeadId === uId) {
      return res.status(400).json({
        message: "Cannot remove Team Lead. Assign a new lead before removal.",
      });
    }

    await prisma.$transaction(async (tx) => {
      const teamProjectIds = team.projects.map((p) => p.id);

      // Delete Assigned tasks
      if (teamProjectIds.length > 0) {
        await tx.task.deleteMany({
          where: {
            userId: uId,
            projectId: { in: teamProjectIds },
          },
        });
      }

      // Disconnect the user from the team
      await tx.team.update({
        where: { id: tId },
        data: {
          users: { disconnect: { id: uId } },
        },
      });

      // Delete the UserChatState. This removes the team from their sidebar instantly.
      if (team.chat) {
        await tx.userChatState.delete({
          where: {
            userId_chatId: { userId: uId, chatId: team.chat.id },
          },
        });
      }
    });

    res.status(200).json({
      status: "success",
      message: "User removed, tasks cleared, and chat access revoked.",
    });
  } catch (error) {
    console.error("Remove Member Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const changeTeamLead = async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const { newLeadId } = req.body;

    // Params Validation
    if (!teamId || typeof teamId !== "string") {
      return res.status(400).json({ message: "Team ID is required" });
    }

    const nLId = parseInt(newLeadId);
    const tId = parseInt(teamId);

    // Check if the team exists and if the newLead is a member
    const team = await prisma.team.findUnique({
      where: { id: tId },
      include: {
        chat: { select: { id: true } },
        users: {
          where: { id: nLId },
          select: { id: true },
        },
      },
    });

    // If Team does not exist
    if (!team) return res.status(404).json({ message: "Team not found" });

    // Using a transaction
    const updatedTeam = await prisma.$transaction(async (tx) => {
      // If new lead is not a member, add them and create their chat state
      if (team.users.length === 0) {
        await tx.team.update({
          where: { id: tId },
          data: {
            users: { connect: { id: nLId } },
          },
        });

        // Initialize Chat State so they can see the chat in the sidebar
        if (team.chat) {
          await tx.userChatState.create({
            data: {
              userId: nLId,
              chatId: team.chat.id,
            },
          });
        }
      }

      // Update the team lead
      return await tx.team.update({
        where: { id: tId },
        data: { teamLeadId: nLId },
        include: {
          TeamLead: { select: { id: true, name: true } },
        },
      });
    });

    res.status(200).json({
      status: "success",
      message: "Team lead updated successfully",
      data: updatedTeam,
    });
  } catch (error: any) {
    if (error.code === "P2014" || error.code === "P2002") {
      //Prisma error thrown because of `@unique` constraint, if user is already a teamLead
      return res
        .status(400)
        .json({ message: "This user is already leading another team." });
    }
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateTeam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, teamLeadId, memberIds } = req.body;

    // validation
    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Team ID is required." });
    }

    const teamId = parseInt(id);
    if (isNaN(teamId)) {
      return res.status(400).json({ message: "Valid ID required." });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get current state to compare members
      const existingTeam = await tx.team.findUnique({
        where: { id: teamId },
        include: {
          users: { select: { id: true } },
          chat: { select: { id: true } },
        },
      });

      if (!existingTeam) throw new Error("NOT_FOUND");

      const currentMemberIds = existingTeam.users.map((u) => u.id);
      const newMemberIds =
        memberIds && Array.isArray(memberIds)
          ? memberIds.map(Number)
          : currentMemberIds;

      // Identify who is being added and who is being removed
      const usersToAdd = newMemberIds.filter(
        (id) => !currentMemberIds.includes(id),
      );
      const usersToRemove = currentMemberIds.filter(
        (id) => !newMemberIds.includes(id),
      );

      // Build the update object
      const updateData: any = {};
      if (name) updateData.name = name;
      if (description) updateData.description = description;
      if (teamLeadId) updateData.teamLeadId = parseInt(teamLeadId);

      // Use 'set' to update the relation table
      updateData.users = {
        set: newMemberIds.map((id) => ({ id })),
      };

      const updatedTeam = await tx.team.update({
        where: { id: teamId },
        data: updateData,
        include: {
          TeamLead: { select: { name: true, email: true } },
          users: { select: { id: true, name: true } },
        },
      });

      // Syncing chat states
      if (existingTeam.chat) {
        const chatId = existingTeam.chat.id;

        // Create states for new members
        if (usersToAdd.length > 0) {
          await tx.userChatState.createMany({
            data: usersToAdd.map((uId) => ({
              userId: uId,
              chatId: chatId,
            })),
            skipDuplicates: true,
          });
        }

        // Delete states for removed members
        if (usersToRemove.length > 0) {
          await tx.userChatState.deleteMany({
            where: {
              chatId: chatId,
              userId: { in: usersToRemove },
            },
          });
        }
      }

      return updatedTeam;
    });

    res.status(200).json({ status: "success", data: result });
  } catch (error: any) {
    if (error.message === "NOT_FOUND")
      return res.status(404).json({ message: "Team not found" });
    if (error.code === "P2014" || error.code === "P2002") {
      return res
        .status(400)
        .json({ message: "User is already leading another team." });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteTeam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        message: "Team ID required.",
      });
    }

    const teamId = parseInt(id);

    // Check if the team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        chat: true,
        users: {
          select: { id: true },
        },
      },
    });

    if (!team) {
      return res.status(404).json({ message: "Team not found." });
    }

    // Perform deletion in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete the associated Chat first if it exists
      if (team.chat) {
        await tx.chat.delete({
          where: { id: team.chat.id },
        });
      }

      const teamMemberIds = team?.users.map((u) => u.id); // getting team members to delete their tasks

      // Deleting Tasks assigned to the team members
      await tx.task.deleteMany({
        where: {
          project: {
            teams: { some: { id: teamId } },
          },
          userId: { in: teamMemberIds },
        },
      });

      // Deleting Team. Prisma will automatically handle disconnecting users and projects
      await tx.team.delete({
        where: { id: teamId },
      });
    });

    res.status(200).json({
      status: "success",
      message: `Team "${team.name}" and its associated chat have been deleted.`,
    });
  } catch (error: any) {
    console.error("Delete Team Error:", error);

    if (error.code === "P2003") {
      return res.status(400).json({
        message: "Cannot delete team due to db relations",
      });
    }

    res.status(500).json({ message: "Internal Server Error" });
  }
};
