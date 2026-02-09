import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";

export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, projectId, userId } = req.body;
    const loggedInUserId = req.user?.id;

    // Verify Project exists and get its Team information
    const project = await prisma.project.findUnique({
      where: { id: parseInt(projectId) },
      include: { teams: { select: { id: true, teamLeadId: true } } },
    });

    // If project does not exist
    if (!project) return res.status(404).json({ message: "Project not found" });

    const isTeamLead = project.teams.some(
      (team) => team.teamLeadId === loggedInUserId,
    );

    // If Task creator is not the TeamLead nor admin
    if (!isTeamLead && !req.user?.isAdmin) {
      return res
        .status(403)
        .json({ message: "Only the Team Lead can create tasks." });
    }

    // Create the Task
    const newTask = await prisma.task.create({
      data: {
        title,
        completed: false,
        projectId: parseInt(projectId),
        userId: parseInt(userId),
      },
      include: {
        user: { select: { name: true, email: true } },
        project: { select: { name: true } },
      },
    });

    res.status(201).json({ status: "success", data: newTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Toggle Task as completed/not-completed
export const updateTaskStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;
    const loggedInUserId = req.user?.id;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Task ID is required" });
    }
    if (!loggedInUserId) {
      return res.status(401).json({ message: "Unauthenticated requested" });
    }

    // Find the task
    const task = await prisma.task.findUnique({
      where: { id: parseInt(id) },
      include: {
        project: { select: { teams: { select: { teamLeadId: true } } } }, // Getting teamLeadId too
      },
    });

    if (!task) return res.status(404).json({ message: "Task not found" });

    const teamLeadIds = task.project.teams.map((team) => team.teamLeadId);
    const isTeamLead = teamLeadIds.includes(loggedInUserId);

    // Only the assigned user, Team Lead, or admin can update status
    if (!isTeamLead && task.userId !== loggedInUserId && !req.user?.isAdmin) {
      return res.status(403).json({
        message: "You do not have authorization to update this task.",
      });
    }

    // Update Task status
    const updatedTask = await prisma.task.update({
      where: { id: parseInt(id) },
      data: { completed: !!completed },
    });

    console.log("Updated Task Status: ", updatedTask);
    

    res.status(200).json({ status: "success", data: updatedTask });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, userId } = req.body;
    const loggedInUserId = req.user?.id;
    const isAdmin = req.user?.isAdmin;

    // Validating
    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Task ID is required" });
    }
    if (!loggedInUserId) {
      return res.status(401).json({ message: "Unauthenticated request" });
    }

    // Fetch task and the TeamLead ID
    const task = await prisma.task.findUnique({
      where: { id: parseInt(id) },
      include: {
        project: {
          select: {
            teams: {
              select: { teamLeadId: true },
            },
          },
        },
      },
    });

    if (!task) return res.status(404).json({ message: "Task not found" });

    // If not Admin or TeamLead, do not allow update
    const isLead = task.project.teams.some(
      (team) => team.teamLeadId === loggedInUserId,
    );
    if (!isLead && !isAdmin) {
      return res.status(403).json({
        message:
          "Access Denied: Only the Team Lead or an Admin can edit task details.",
      });
    }

    // Data to be updated. To not update fields that are not sent from frontend
    const data: any = {};
    if (title) {
      data.title = title;
    }
    if (userId) {
      data.user = { connect: { id: parseInt(userId) } };
    }

    // Perform the update
    const updatedTask = await prisma.task.update({
      where: { id: parseInt(id) },
      data: data,
      include: {
        user: { select: { name: true } }, // Return the name of the new assignee
      },
    });

    res.status(200).json({
      status: "success",
      message: "Task updated successfully",
      data: updatedTask,
    });
  } catch (error) {
    console.error("Task Update Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getMyTasks = async (req: Request, res: Response) => {
  try {
    const loggedInUserId = req.user?.id;
    const isAdmin = req.user?.isAdmin;

    if (!loggedInUserId) {
      return res.status(401).json({ message: "Unauthenticated User" });
    }

    // Extract and parse query parameters
    const { teamId, projectId, userId } = req.query;
    const targetUserId = userId ? parseInt(userId as string) : null;
    const filterTeamId = teamId ? parseInt(teamId as string) : null;
    const filterProjectId = projectId ? parseInt(projectId as string) : null;

    // Initial Role Check: Is the requester a Team Lead?
    const ledTeam = await prisma.team.findFirst({
      where: { teamLeadId: loggedInUserId },
      select: { id: true },
    });
    const ledTeamId = ledTeam?.id;

    // Build the Dynamic Filter Object
    const where: any = {};

    if (targetUserId) {
      // When specifically looking for ONE user's tasks
      where.userId = targetUserId;
    } else if (isAdmin) {
      // If Admin is looking at "All Tasks",  No filter applied
    } else if (ledTeamId) {
      // If Lead is looking at "All Tasks",  Filter by their managed team
      where.OR = [
        { userId: loggedInUserId }, // My tasks
        {
          user: {
            teams: { some: { id: ledTeamId } } // Tasks of anyone in my team
          }
        }
      ];
    } else {
      // Regular Member looking at "All Tasks",  Only see self
      where.userId = loggedInUserId;
    }

    // Apply other global filters if provided in URL
    if (filterProjectId) where.projectId = filterProjectId;

    if (filterTeamId) {
      where.project = {
        ...where.project,
        teams: { some: { id: filterTeamId } },
      };
    }

    // Block non-admins from looking at other users' tasks
    if (targetUserId && targetUserId !== loggedInUserId && !isAdmin) {
      const isLeadOfTarget = await prisma.team.count({
        where: {
          teamLeadId: loggedInUserId,
          users: { some: { id: targetUserId } },
          // If a specific team/project was filtered, ensure lead has access to those too
          ...(filterTeamId && { id: filterTeamId }),
          ...(filterProjectId && {
            projects: { some: { id: filterProjectId } },
          }),
        },
      });

      if (isLeadOfTarget === 0) {
        // If not lead, do not allow fetching other user's data
        return res.status(403).json({
          message:
            "Forbidden: You do not have permission to view this user's tasks.",
        });
      }
    }

    // Execute Query
    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: {
          select: {
            name: true,
            teams: { select: { name: true } },
          },
        },
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { id: "desc" },
    });

    res.status(200).json({ status: "success", data: tasks });
  } catch (error) {
    console.error("Get Tasks Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getTaskById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const loggedInUserId = req.user?.id;
    const isAdmin = req.user?.isAdmin;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Task ID is required" });
    }

    const taskId = parseInt(id);

    // Fetch task with project/team info to verify permissions
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            teams: { select: { teamLeadId: true } },
          },
        },
        user: {
          select: { id: true, name: true },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // --- Permission Check ---
    const isAssignee = task.userId === loggedInUserId;
    const isLead = task.project.teams.some(
      (team) => team.teamLeadId === loggedInUserId,
    );

    if (!isAdmin && !isAssignee && !isLead) {
      return res.status(403).json({
        message: "Access Denied: You don't have permission to view this task.",
      });
    }

    res.status(200).json({
      status: "success",
      data: task,
    });
  } catch (error) {
    console.error("Get Task Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validation
    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Invalid Task ID" });
    }

    const taskId = parseInt(id);

    // deleting. Prisma will throw an error if the record doesn't exist.
    await prisma.task.delete({
      where: { id: taskId },
    });

    res.status(200).json({
      status: "success",
      message: "Task deleted successfully",
    });
  } catch (error: any) {
    // Prisma's error code for "Record to delete not found"
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Task not found" });
    }

    console.error("Delete Task Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
