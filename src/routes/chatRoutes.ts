import { Router } from "express";
import {
  sendMessage,
  getUserChats,
  markAsRead,
  getChatMessages,
  deleteMessage,
} from "../controllers/chatController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = Router();

// All routes are protected
router.use(protect);

router.get("/", getUserChats);

router.get("/:chatId/messages", getChatMessages);

router.post("/send", sendMessage);

router.patch("/:chatId/read", markAsRead);

router.delete("/message/:id", deleteMessage);

export default router;
