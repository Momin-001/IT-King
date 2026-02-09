import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";

export const getUserModelsCount = async (req: Request, res: Response) => {
  const id = req.user?.id;

  if (!id) {
    return res.status(401).json({ message: "Unauthorised request." });
  }

  const teams = await prisma.team.count({
    where: {
      users: {
        some: { id: id }, // only teams that the user is part of
      },
    },
  });
  console.log("Teams: ", teams);

  const projects = await prisma.project.count({
    where: {
      teams: {
        some: {
          users: { some: { id: id } },
        },
      },
    },
  });
  console.log("Projects: ", projects);

  res.status(200).json({
    teams,
    projects,
  });
};

export const getAllModelsCount = async (req: Request, res: Response) => {
  const users = await prisma.user.count({
    where: { isAdmin: false },
  });
  console.log("users: ", users);

  const teams = await prisma.team.count();
  console.log("Teams: ", teams);

  const projects = await prisma.project.count();
  console.log("Projects: ", projects);

  res.status(200).json({
    users,
    teams,
    projects,
  });
};
