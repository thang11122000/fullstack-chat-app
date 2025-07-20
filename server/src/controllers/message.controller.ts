import { Request, Response } from "express";
import { messageService } from "../services/messageService";
import { ResponseHelper } from "../utils/response";
import { asyncHandler } from "../middleware/errorHandler";
import { SocketService } from "../services/socketService";

export const getUsersForSidebar = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await messageService.getUsersWithMessages(req.user._id);

    return ResponseHelper.success(
      res,
      {
        users: result.users,
        unreadCount: result.unreadCount,
      },
      "Users retrieved successfully"
    );
  }
);

export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const { id: otherUserId } = req.params;
  const { page = "1", limit = "500" } = req.query;

  const result = await messageService.getConversationMessages(
    req.user._id,
    otherUserId,
    parseInt(page as string),
    parseInt(limit as string)
  );

  return ResponseHelper.success(res, result, "Messages retrieved successfully");
});

export const markMessagesAsSeen = asyncHandler(
  async (req: Request, res: Response) => {
    const { id: messageId } = req.params;

    // Get message first to get senderId
    const message = await messageService.getMessageById(messageId);
    if (!message) {
      return ResponseHelper.error(res, "Message not found", 404);
    }

    // Mark message as seen
    await messageService.markSingleMessageAsSeen(messageId, req.user._id);

    // Emit read receipt to message sender if online
    const socketService = SocketService.getInstance();
    if (socketService && socketService.isUserOnline(message.senderId)) {
      socketService.emitToOnlineUsers([message.senderId], "messages_read", {
        messageIds: [messageId],
        readBy: req.user._id,
      });
    }

    return ResponseHelper.success(res, null, "Message marked as seen");
  }
);

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const { text, image } = req.body;
  const receiverId = req.params.id;
  const senderId = req.user._id;

  const message = await messageService.createMessage({
    senderId,
    receiverId,
    text,
    image,
  });

  // Emit message to online receiver
  const socketService = SocketService.getInstance();

  if (socketService && socketService.isUserOnline(receiverId)) {
    socketService.emitToOnlineUsers([receiverId], "message_received", message);
  } else {
    console.log("Receiver not online or SocketService not available");
  }

  return ResponseHelper.created(res, { message }, "Message sent successfully");
});

export const deleteMessage = asyncHandler(
  async (req: Request, res: Response) => {
    const { id: messageId } = req.params;

    // Get message first to get receiverId
    const message = await messageService.getMessageById(messageId);
    if (!message) {
      return ResponseHelper.error(res, "Message not found", 404);
    }

    await messageService.deleteMessage(messageId, req.user._id);

    // Emit delete notification to receiver if online
    const socketService = SocketService.getInstance();
    if (socketService && socketService.isUserOnline(message.receiverId)) {
      socketService.emitToOnlineUsers([message.receiverId], "message_deleted", {
        messageId,
        deletedBy: req.user._id,
      });
    }

    return ResponseHelper.success(res, null, "Message deleted successfully");
  }
);

export const getUnreadCount = asyncHandler(
  async (req: Request, res: Response) => {
    const unreadCount = await messageService.getUnreadMessagesCount(
      req.user._id
    );

    return ResponseHelper.success(
      res,
      { unreadCount },
      "Unread count retrieved successfully"
    );
  }
);
