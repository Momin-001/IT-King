import express from "express";
import {
  createProject,
  getTeamProjects,
  getProjectDetails,
  deleteProject,
  getAllProjects,
  updateProject,
  toggleProjectStatus,
} from "../controllers/projectController.js";
import { isAdmin, protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All routes are protected
router.use(protect);

router.post("/", isAdmin, createProject);
router.get("/", getAllProjects);
router.get("/team/:teamId", getTeamProjects);
router.get("/:id", getProjectDetails);
router.patch("/:id", isAdmin, updateProject);
router.patch("/:id/status", protect, toggleProjectStatus);
router.delete("/:id", isAdmin, deleteProject);

export default router;
