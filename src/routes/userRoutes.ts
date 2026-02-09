import express from "express";
import {
  protect,
  isAdmin,
  isAdminOrLead,
} from "../middlewares/authMiddleware.js";
import {
  getAllUsers,
  getMe,
  deleteUser,
  toggleUserActivation,
  getVerifiedUsers,
  getLedTeamId,
  transferAdmin,
  updateName,
  updatePassword,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/all", protect, isAdmin, getAllUsers);
router.get("/all/verified", protect, isAdminOrLead, getVerifiedUsers);
router.get("/:userId/led-team", protect, getLedTeamId);
router.patch("/:id/toggle-activation", protect, isAdmin, toggleUserActivation);
router.get("/me", protect, getMe);
router.patch("/update-name", protect, updateName);
router.patch("/update-password", protect, updatePassword);
router.patch("/transfer-ownership", protect, isAdmin, transferAdmin);
router.delete("/:id", protect, isAdmin, deleteUser);

export default router;
