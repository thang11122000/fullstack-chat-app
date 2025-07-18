import { Request, Response } from "express";
import { messageService } from "../services/messageService";
import { ResponseHelper } from "../utils/response";
import { asyncHandler } from "../middleware/errorHandler";
import { onlineUsers } from "../socket/socketHandlers";
import { io } from "..";

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
  const { page = "1", limit = "50" } = req.query;

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

    await messageService.markSingleMessageAsSeen(messageId, req.user._id);

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

  if (onlineUsers.has(receiverId)) {
    for (const socketId of onlineUsers.get(receiverId)!) {
      io.to(socketId).emit("message_received", message);
    }
  }

  return ResponseHelper.created(res, { message }, "Message sent successfully");
});

export const deleteMessage = asyncHandler(
  async (req: Request, res: Response) => {
    const { id: messageId } = req.params;

    await messageService.deleteMessage(messageId, req.user._id);

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
