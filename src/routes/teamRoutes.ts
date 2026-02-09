import express from "express";
import {
  createTeam,
  addMemberToTeam,
  removeMember,
  getTeamDetails,
  changeTeamLead,
  getAllTeams,
  deleteTeam,
  updateTeam,
} from "../controllers/teamController.js";
import { protect, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All team routes require being logged in
router.use(protect);

router.get("/", getAllTeams);

// POST /teams
router.post("/", isAdmin, createTeam);

// GET teams/:id
router.get("/:id", getTeamDetails);

router.patch("/:id", protect, isAdmin, updateTeam);

// PATCH /api/teams/:teamId/change-lead
router.patch("/:teamId/change-lead", isAdmin, changeTeamLead);

// POST /api/teams/:teamId/members
router.post("/:teamId/members", isAdmin, addMemberToTeam);

// DELETE /api/teams/:teamId/members
router.delete("/:teamId/members", isAdmin, removeMember);

router.delete("/:id", protect, isAdmin, deleteTeam);

export default router;
