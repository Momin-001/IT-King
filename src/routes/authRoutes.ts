import { Router } from "express";
import {
  login,
  getUnverifiedUserData,
  createUnverifiedUser,
  completeVerification,
  refreshAccessToken,
  deleteUnverifiedUser,
} from "../controllers/authController.js";
import { isAdmin, protect } from "../middlewares/authMiddleware.js";

const router = Router();

// Public Routes
router.post("/login", login);
router.post("/refresh", refreshAccessToken);
router.get("/verify-details/:token", getUnverifiedUserData);
router.post("/verify-complete/:token", completeVerification);

// Admin routes
router.post("/register-user", protect, isAdmin, createUnverifiedUser);
router.delete("/unverified/:id", protect, isAdmin, deleteUnverifiedUser);

export default router;
