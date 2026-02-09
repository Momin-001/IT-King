import express from "express";
import {
  createTask,
  updateTaskStatus,
  getMyTasks,
  updateTask,
  deleteTask,
  getTaskById,
} from "../controllers/taskController.js";
import { isAdminOrLead, protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect); // All task actions require login

router.get("/", getMyTasks); // Personal dashboard / All Tasks
router.get("/:id", protect, getTaskById);
router.post("/", createTask); // Create & Assign
router.patch("/:id/status", updateTaskStatus); // Mark as done
router.put("/:id", updateTask); // Update Task Info
router.delete("/:id", protect, isAdminOrLead, deleteTask); // delete task

export default router;
