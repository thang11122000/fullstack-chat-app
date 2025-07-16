import {
  getMessages,
  getUserForSidebar,
  markMessagesAsSeen,
  sendMessage,
} from "@/controllers/message.controller";
import { authMiddleware } from "@/middleware/auth";
import express from "express";

const router = express.Router();

router.get("/users", authMiddleware, getUserForSidebar);
router.get("/:id", authMiddleware, getMessages);
router.put("/mark/:id", authMiddleware, markMessagesAsSeen);
router.post("/send/:id", authMiddleware, sendMessage);

export default router;
