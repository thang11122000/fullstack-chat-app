import express from "express";
import { body, validationResult } from "express-validator";
import mongoose from "mongoose";
import User from "../models/User";
import Message from "../models/Message";
import Chat from "../models/Chat";
import { authMiddleware } from "../middleware/auth";

const router = express.Router();

// Get all chats for current user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.userId,
    })
      .populate("participants", "username avatar isOnline lastSeen")
      .populate("lastMessage", "content messageType createdAt sender")
      .sort({ lastMessageTime: -1 });

    res.json({
      success: true,
      chats,
    });
  } catch (error) {
    console.error("Get chats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get messages for a specific chat
router.get("/:chatId/messages", authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Validate chatId
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid chat ID",
      });
    }

    // Check if user is participant in the chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.userId,
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    const messages = await Message.find({
      $or: [
        { sender: req.userId, receiver: { $in: chat.participants } },
        { receiver: req.userId, sender: { $in: chat.participants } },
      ],
    })
      .populate("sender", "username avatar")
      .populate("receiver", "username avatar")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    return res.json({
      success: true,
      messages: messages.reverse(),
      pagination: {
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("Get messages error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Create or get existing chat with another user
router.post(
  "/create",
  authMiddleware,
  [
    body("participantId")
      .notEmpty()
      .withMessage("Participant ID is required")
      .isMongoId()
      .withMessage("Invalid participant ID"),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { participantId } = req.body;

      // Check if trying to create chat with self
      if (participantId === req.userId) {
        return res.status(400).json({
          success: false,
          message: "Cannot create chat with yourself",
        });
      }

      // Check if participant exists
      const participant = await User.findById(participantId);
      if (!participant) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Check if chat already exists
      let chat = await Chat.findOne({
        participants: { $all: [req.userId, participantId] },
      })
        .populate("participants", "username avatar isOnline lastSeen")
        .populate("lastMessage", "content messageType createdAt sender");

      if (chat) {
        return res.json({
          success: true,
          message: "Chat already exists",
          chat,
        });
      }

      // Create new chat
      chat = new Chat({
        participants: [req.userId, participantId],
      });

      await chat.save();

      // Populate the chat
      await chat.populate("participants", "username avatar isOnline lastSeen");

      return res.status(201).json({
        success: true,
        message: "Chat created successfully",
        chat,
      });
    } catch (error) {
      console.error("Create chat error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// Search users for creating new chats
router.get("/users/search", authMiddleware, async (req, res) => {
  try {
    const { q = "" } = req.query;

    if (!q || typeof q !== "string" || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters long",
      });
    }

    const users = await User.find({
      _id: { $ne: req.userId },
      $or: [
        { username: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
    })
      .select("username email avatar isOnline lastSeen")
      .limit(10);

    return res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Search users error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get unread message count
router.get("/unread-count", authMiddleware, async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({
      receiver: req.userId,
      isRead: false,
    });

    res.json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Mark messages as read
router.put(
  "/:chatId/read",
  authMiddleware,
  [
    body("messageIds")
      .isArray({ min: 1 })
      .withMessage("Message IDs must be a non-empty array")
      .custom((value) => {
        return value.every((id: string) => mongoose.Types.ObjectId.isValid(id));
      })
      .withMessage("All message IDs must be valid"),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { chatId } = req.params;
      const { messageIds } = req.body;

      // Validate chatId
      if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid chat ID",
        });
      }

      // Check if user is participant in the chat
      const chat = await Chat.findOne({
        _id: chatId,
        participants: req.userId,
      });

      if (!chat) {
        return res.status(404).json({
          success: false,
          message: "Chat not found",
        });
      }

      // Update messages as read
      const result = await Message.updateMany(
        {
          _id: { $in: messageIds },
          receiver: req.userId,
          isRead: false,
        },
        {
          isRead: true,
          readAt: new Date(),
        }
      );

      // Update chat unread count
      chat.unreadCount.set(req.userId!, 0);
      await chat.save();

      return res.json({
        success: true,
        message: "Messages marked as read",
        updatedCount: result.modifiedCount,
      });
    } catch (error) {
      console.error("Mark as read error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

export default router;
