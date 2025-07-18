import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User";
import Message from "../models/Message";
import Chat from "../models/Chat";
import mongoose from "mongoose";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

// Khai báo biến toàn cục
export const onlineUsers = new Map<string, Set<string>>();

async function emitOnlineUsers(io: Server) {
  const userIds = Array.from(onlineUsers.keys());
  io.emit("getOnlineUsers", userIds);
}

export const setupSocketHandlers = (io: Server) => {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      console.log(token);
      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await User.findById(decoded.userId);
      if (!user) {
        return next(new Error("User not found"));
      }

      socket.userId = decoded.userId;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.user.fullname} connected`);

    if (socket.userId) {
      if (!onlineUsers.has(socket.userId)) {
        onlineUsers.set(socket.userId, new Set());
      }
      onlineUsers.get(socket.userId)!.add(socket.id);
      console.log(onlineUsers);
      socket.join(socket.userId);
      emitOnlineUsers(io); // Gửi danh sách user online mới nhất
    }

    // Handle joining a chat room
    socket.on("join_chat", (chatId: string) => {
      socket.join(`chat_${chatId}`);
      console.log(`User ${socket.user.username} joined chat ${chatId}`);
    });

    // Handle leaving a chat room
    socket.on("leave_chat", (chatId: string) => {
      socket.leave(`chat_${chatId}`);
      console.log(`User ${socket.user.username} left chat ${chatId}`);
    });

    // Handle sending a message
    socket.on(
      "send_message",
      async (data: {
        receiverId: string;
        content: string;
        messageType?: "text" | "image" | "file";
      }) => {
        try {
          const { receiverId, content, messageType = "text" } = data;

          // Create new message
          const message = new Message({
            sender: socket.userId,
            receiver: receiverId,
            content,
            messageType,
          });

          await message.save();

          // Populate sender info
          await message.populate("sender", "username avatar");

          // Find or create chat
          let chat = await Chat.findOne({
            participants: { $all: [socket.userId, receiverId] },
          });

          if (!chat) {
            chat = new Chat({
              participants: [socket.userId, receiverId],
              lastMessage: message._id,
              lastMessageTime: new Date(),
            });
          } else {
            chat.lastMessage =
              message._id as unknown as mongoose.Types.ObjectId;
            chat.lastMessageTime = new Date();

            // Update unread count for receiver
            const currentUnreadCount = chat.unreadCount.get(receiverId) || 0;
            chat.unreadCount.set(receiverId, currentUnreadCount + 1);
          }

          await chat.save();

          // Emit message to both users
          io.to(socket.userId!).emit("message_sent", {
            message,
            chatId: chat._id,
          });

          // Gửi socket event nếu receiver đang online
          if (onlineUsers.has(receiverId)) {
            for (const socketId of onlineUsers.get(receiverId)!) {
              io.to(socketId).emit("message_received", { message });
            }
          }

          // Emit chat update to both users
          io.to(socket.userId!).emit("chat_updated", chat);
          io.to(receiverId).emit("chat_updated", chat);
        } catch (error) {
          console.error("Error sending message:", error);
          socket.emit("error", { message: "Failed to send message" });
        }
      }
    );

    // Handle marking messages as read
    socket.on(
      "mark_as_read",
      async (data: { chatId: string; messageIds: string[] }) => {
        try {
          const { chatId, messageIds } = data;

          // Update messages as read
          await Message.updateMany(
            {
              _id: { $in: messageIds },
              receiver: socket.userId,
              isRead: false,
            },
            {
              isRead: true,
              readAt: new Date(),
            }
          );

          // Update chat unread count
          const chat = await Chat.findById(chatId);
          if (chat) {
            chat.unreadCount.set(socket.userId!, 0);
            await chat.save();

            // Emit read receipt to sender
            const otherParticipant = chat.participants.find(
              (p) => p.toString() !== socket.userId
            );

            if (otherParticipant) {
              io.to(otherParticipant.toString()).emit("messages_read", {
                chatId,
                messageIds,
                readBy: socket.userId,
              });
            }
          }
        } catch (error) {
          console.error("Error marking messages as read:", error);
          socket.emit("error", { message: "Failed to mark messages as read" });
        }
      }
    );

    // Handle typing indicators
    socket.on(
      "typing_start",
      (data: { chatId: string; receiverId: string }) => {
        io.to(data.receiverId).emit("user_typing", {
          chatId: data.chatId,
          userId: socket.userId,
          username: socket.user.username,
          isTyping: true,
        });
      }
    );

    socket.on("typing_stop", (data: { chatId: string; receiverId: string }) => {
      io.to(data.receiverId).emit("user_typing", {
        chatId: data.chatId,
        userId: socket.userId,
        username: socket.user.username,
        isTyping: false,
      });
    });

    // Handle user disconnect
    socket.on("disconnect", () => {
      console.log(`User ${socket.user.username} disconnected`);
      if (socket.userId) {
        const userSockets = onlineUsers.get(socket.userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            onlineUsers.delete(socket.userId);
          }
        }
        emitOnlineUsers(io); // Gửi lại khi có user offline
      }
    });
  });
};
