import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";

export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, description, isComplete, startDate, dueDate, teamIds } =
      req.body;

    // Validation.
    if (
      !name ||
      !description ||
      !teamIds ||
      typeof name !== "string" ||
      typeof description !== "string" ||
      !Array.isArray(teamIds)
    ) {
      return res.status(400).json({
        message:
          "Project name, description and an array of Team IDs are required",
      });
    }

    // Dates validation
    if (startDate && dueDate) {
      // If both start and due dates are given
      const start = new Date(startDate);
      const due = new Date(dueDate);
      if (due < start) {
        // If due date is before start date
        return res
          .status(400)
          .json({ message: "Due date can not be before start date" });
      }
    } else if (dueDate) {
      // If only due date is given
      const due = new Date(dueDate);
      if (due < new Date()) {
        // If startDate(default: now) is not given and dueDate is in the past
        return res
          .status(400)
          .json({ message: "Due date can not be before start date" });
      }
    }

    const newProject = await prisma.project.create({
      data: {
        name,
        description,
        isComplete: isComplete || false,
        startDate: startDate ? new Date(startDate) : new Date(), // Convert strings to Date objects
        dueDate: dueDate ? new Date(dueDate) : new Date(), // Convert strings to Date objects
        teams: {
          // Connect multiple teams at once
          connect: teamIds.map((id: number) => ({
            id: parseInt(id.toString()),
          })),
        },
      },
      include: {
        teams: { select: { name: true } },
      },
    });

    res.status(201).json({ status: "success", data: newProject });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAllProjects = async (req: Request, res: Response) => {
  try {
    const id = req.user?.id;

    // Validation
    if (!id) {
      return res.status(401).json({ message: "Unauthorised request." });
    }

    const filter: any = req.user?.isAdmin
      ? {}
      : {
          teams: {
            some: {
              users: { some: { id: id } },
            },
          },
        };

    const projects = await prisma.project.findMany({
      where: filter,
      include: {
        // Fetch all assigned teams
        teams: {
          select: {
            id: true,
            name: true,
          },
        },
        // Get the total number of tasks
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      // Sort
      orderBy: {
        startDate: "desc",
      },
    });

    console.log("Sending: ", {
      status: "success",
      results: projects.length,
      data: projects,
    });

    res.status(200).json({
      status: "success",
      results: projects.length,
      data: projects,
    });
  } catch (error) {
    console.error("Get All Projects Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getTeamProjects = async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;

    if (!teamId || typeof teamId !== "string") {
      return res.status(400).json({ message: "Team ID is required" });
    }

    const projects = await prisma.project.findMany({
      where: {
        teams: {
          some: { id: parseInt(teamId) },
        },
      },
      include: {
        _count: { select: { tasks: true } },
      },
    });

    res.status(200).json({ status: "success", data: projects });
  } catch (error) {
    console.log("Error: ", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getProjectDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const loggedInUserId = req.user?.id;

    // Validation
    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Invalid Project ID" });
    }
    if (!loggedInUserId) {
      return res.status(401).json({ message: "Unauthorised request" });
    }

    // Fetch project to see who the leads are for all assigned teams
    const projectInfo = await prisma.project.findUnique({
      where: { id: parseInt(id) },
      select: {
        teams: { select: { teamLeadId: true } },
      },
    });

    if (!projectInfo) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user is Admin OR lead of ANY team assigned to this project. Used for filtering tasks
    const isTeamLeadOrAdmin =
      req.user?.isAdmin ||
      projectInfo.teams.some((t) => t.teamLeadId === loggedInUserId);

    // Fetch full details
    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) },
      include: {
        teams: {
          where: req.user?.isAdmin // if not admin, only show own team
            ? {}
            : {
                users: {
                  some: { id: loggedInUserId },
                },
              },
          select: { id: true, name: true, teamLeadId: true },
        },
        tasks: {
          where: isTeamLeadOrAdmin ? {} : { userId: loggedInUserId }, //If admin or TeamLead, show all tasks. Else, show assigned tasks only
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    res.status(200).json({ status: "success", data: project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, isComplete, startDate, dueDate, teamIds } =
      req.body;

    // Validation
    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Invalid Project ID" });
    }

    const projectId = parseInt(id);

    // Build the data(to be updated) dynamically. So only the updated fields are changed
    const data: any = {};
    if (name) data.name = name;
    if (description !== undefined) data.description = description;
    if (startDate) data.startDate = new Date(startDate);
    if (dueDate) data.dueDate = new Date(dueDate);

    // adding / removing teams
    if (teamIds && Array.isArray(teamIds)) {
      data.teams = {
        set: teamIds.map((id) => ({ id: Number(id) })),
      };
    }

    if (typeof isComplete === "boolean") {
      data.isComplete = isComplete;
    }

    const updatedProject = await prisma.$transaction(async (tx) => {
      // DB update
      const updatedProject = await tx.project.update({
        where: { id: projectId },
        data: data,
        include: {
          teams: {
            select: { id: true, name: true },
          },
          _count: {
            select: { tasks: true },
          },
        },
      });

      // Delete all tasks for this project where the user is NOT in the new team list
      await tx.task.deleteMany({
        where: {
          projectId: projectId,
          user: {
            teams: {
              none: {
                id: { in: teamIds.map(Number) },
              },
            },
          },
        },
      });

      return updateProject;
    });

    res.status(200).json({
      status: "success",
      message: "Project updated successfully",
      data: updatedProject,
    });
  } catch (error: any) {
    console.error("Update Project Error:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const toggleProjectStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isComplete } = req.body;
    const loggedInUserId = req.user?.id;

    // Validation
    if (!id || typeof isComplete !== "boolean" || typeof id !== "string") {
      return res.status(400).json({
        message: "Project ID and a boolean 'isComplete' status are required",
      });
    }

    // Permission Check: Only Admin or Team Lead of an assigned team can close the project
    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) },
      select: {
        teams: { select: { teamLeadId: true } },
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isAuthorized =
      req.user?.isAdmin ||
      project.teams.some((team) => team.teamLeadId === loggedInUserId);

    if (!isAuthorized) {
      return res.status(403).json({
        message: "Only Admins or Team Leads can change the project status",
      });
    }

    // Update the Status
    const updatedProject = await prisma.project.update({
      where: { id: parseInt(id) },
      data: { isComplete },
      // Include teams so the frontend can refresh the sidebar/details immediately
      include: {
        teams: { select: { id: true, name: true } },
      },
    });

    res.status(200).json({
      status: "success",
      message: `Project marked as ${isComplete ? "complete" : "active"}`,
      data: updatedProject,
    });
  } catch (error) {
    console.error("Toggle Status Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validation
    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Project ID required" });
    }

    await prisma.project.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
