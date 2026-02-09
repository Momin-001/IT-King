import express from "express";

import { isAdmin, protect } from "../middlewares/authMiddleware.js";
import { getAllModelsCount, getUserModelsCount } from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/", protect, getUserModelsCount);
router.get("/admin", protect, isAdmin, getAllModelsCount);

export default router;
