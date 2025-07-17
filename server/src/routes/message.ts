import {
  getMessages,
  getUsersForSidebar,
  markMessagesAsSeen,
  sendMessage,
  deleteMessage,
  getUnreadCount,
} from "../controllers/message.controller";
import { authMiddleware } from "../middleware/auth";
import express from "express";
import { body, param } from "express-validator";

const router = express.Router();

// Get users for sidebar with unread count
router.get("/users", authMiddleware, getUsersForSidebar);

// Get conversation messages with pagination
router.get(
  "/conversation/:id",
  authMiddleware,
  [param("id").isMongoId().withMessage("Invalid user ID")],
  getMessages
);

// Get unread messages count
router.get("/unread-count", authMiddleware, getUnreadCount);

// Mark single message as seen
router.put(
  "/mark-seen/:id",
  authMiddleware,
  [param("id").isMongoId().withMessage("Invalid message ID")],
  markMessagesAsSeen
);

// Send message
router.post(
  "/send/:id",
  authMiddleware,
  [
    param("id").isMongoId().withMessage("Invalid receiver ID"),
    body("text")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage("Message text must be between 1 and 1000 characters"),
    body("image")
      .optional()
      .isString()
      .withMessage("Image must be a valid base64 string"),
  ],
  sendMessage
);

// Delete message
router.delete(
  "/:id",
  authMiddleware,
  [param("id").isMongoId().withMessage("Invalid message ID")],
  deleteMessage
);

export default router;
