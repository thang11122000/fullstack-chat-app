import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { userService } from "./userService";
import { messageService } from "./messageService";
import { logger } from "../utils/logger";
import { AppError } from "../middleware/errorHandler";

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

export interface UserSocketMap {
  [userId: string]: string;
}

export interface TypingData {
  chatId: string;
  receiverId: string;
  isTyping: boolean;
}

export interface MessageData {
  receiverId: string;
  text?: string;
  image?: string;
}

export interface ReadReceiptData {
  messageIds: string[];
  senderId: string;
}

export class SocketService {
  private io: Server;
  private userSocketMap: UserSocketMap = {};
  private static instance: SocketService;

  constructor(io: Server) {
    this.io = io;
    SocketService.instance = this;
  }

  // Static method to get the singleton instance
  public static getInstance(): SocketService {
    return SocketService.instance;
  }

  public initializeSocketHandlers(): void {
    // Add authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      const isAuthenticated = await this.authenticateSocket(socket);
      if (!isAuthenticated) {
        return next(new Error("Authentication error"));
      }
      next();
    });

    this.io.on("connection", (socket: AuthenticatedSocket) => {
      this.handleUserConnection(socket);
      this.setupEventHandlers(socket);
    });
  }

  private async authenticateSocket(
    socket: AuthenticatedSocket
  ): Promise<boolean> {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return false;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const userId = decoded.userId;

      const user = await userService.getUserById(userId);
      if (!user) {
        return false;
      }

      socket.userId = userId;
      socket.user = user;
      return true;
    } catch (error) {
      logger.error("Socket authentication error:", error);
      return false;
    }
  }

  private handleUserConnection(socket: AuthenticatedSocket): void {
    const userId = socket.userId;
    if (!userId) return;

    // Add user to socket map
    this.userSocketMap[userId] = socket.id;

    // Update user online status
    userService
      .updateUserOnlineStatus(userId, true)
      .catch((error) =>
        logger.error("Error updating user online status:", error)
      );

    // Join user to their personal room
    socket.join(userId);

    // Broadcast online users list
    this.broadcastOnlineUsers();

    logger.info(`User ${userId} connected with socket ${socket.id}`);
  }

  private setupEventHandlers(socket: AuthenticatedSocket): void {
    socket.on("join_room", (roomId: string) => {
      socket.join(roomId);
      logger.debug(`User ${socket.userId} joined room ${roomId}`);
    });

    socket.on("leave_room", (roomId: string) => {
      socket.leave(roomId);
      logger.debug(`User ${socket.userId} left room ${roomId}`);
    });

    socket.on("send_message", async (data: MessageData) => {
      await this.handleSendMessage(socket, data);
    });

    socket.on("typing_start", (data: TypingData) => {
      this.handleTypingIndicator(socket, data, true);
    });

    socket.on("typing_stop", (data: TypingData) => {
      this.handleTypingIndicator(socket, data, false);
    });

    socket.on("mark_messages_read", async (data: ReadReceiptData) => {
      await this.handleMarkMessagesRead(socket, data);
    });

    socket.on("disconnect", () => {
      this.handleUserDisconnection(socket);
    });
  }

  private async handleSendMessage(
    socket: AuthenticatedSocket,
    data: MessageData
  ): Promise<void> {
    try {
      const { receiverId, text, image } = data;
      const senderId = socket.userId!;

      // Validate message data
      if (!receiverId) {
        socket.emit("error", { message: "Receiver ID is required" });
        return;
      }

      if (!text && !image) {
        socket.emit("error", { message: "Message must contain text or image" });
        return;
      }

      // Create message via service
      const message = await messageService.createMessage({
        senderId,
        receiverId,
        text,
        image,
      });

      // Emit to sender
      socket.emit("message_sent", message);

      // Emit to receiver if online
      const receiverSocketId = this.userSocketMap[receiverId];
      if (receiverSocketId) {
        this.io.to(receiverSocketId).emit("message_received", message);
      }

      logger.info(`Message sent from ${senderId} to ${receiverId}`);
    } catch (error) {
      const err = error as AppError;
      logger.error("Error handling send message:", err);
      socket.emit("error", {
        message: "Failed to send message",
        details: err.message,
      });
    }
  }

  private handleTypingIndicator(
    socket: AuthenticatedSocket,
    data: TypingData,
    isTyping: boolean
  ): void {
    const { receiverId } = data;
    const senderId = socket.userId!;

    const receiverSocketId = this.userSocketMap[receiverId];
    if (receiverSocketId) {
      this.io.to(receiverSocketId).emit("user_typing", {
        senderId,
        isTyping,
      });
    }
  }

  private async handleMarkMessagesRead(
    socket: AuthenticatedSocket,
    data: ReadReceiptData
  ): Promise<void> {
    try {
      const { messageIds, senderId } = data;
      const readerId = socket.userId!;

      // Mark messages as read
      await Promise.all(
        messageIds.map((messageId) =>
          messageService.markSingleMessageAsSeen(messageId, readerId)
        )
      );

      // Emit read receipt to sender
      const senderSocketId = this.userSocketMap[senderId];
      if (senderSocketId) {
        this.io.to(senderSocketId).emit("messages_read", {
          messageIds,
          readBy: readerId,
        });
      }

      logger.info(
        `Messages marked as read: ${messageIds.length} messages by ${readerId}`
      );
    } catch (error) {
      const err = error as AppError;
      logger.error("Error marking messages as read:", err);
      socket.emit("error", {
        message: "Failed to mark messages as read",
        details: err.message,
      });
    }
  }

  private handleUserDisconnection(socket: AuthenticatedSocket): void {
    const userId = socket.userId;
    if (!userId) return;

    // Remove user from socket map
    delete this.userSocketMap[userId];

    // Update user offline status
    userService
      .updateUserOnlineStatus(userId, false)
      .catch((error) =>
        logger.error("Error updating user offline status:", error)
      );

    // Broadcast updated online users list
    this.broadcastOnlineUsers();

    logger.info(`User ${userId} disconnected`);
  }

  private broadcastOnlineUsers(): void {
    const onlineUsers = Object.keys(this.userSocketMap);
    this.io.emit("getOnlineUsers", onlineUsers);
  }

  // Method to emit message to online users
  public emitToOnlineUsers(userIds: string[], event: string, data: any): void {
    userIds.forEach((userId) => {
      const socketId = this.userSocketMap[userId];
      if (socketId) {
        this.io.to(socketId).emit(event, data);
      }
    });
  }

  // Method to check if user is online
  public isUserOnline(userId: string): boolean {
    return userId in this.userSocketMap;
  }

  // Method to get all online user IDs
  public getOnlineUserIds(): string[] {
    return Object.keys(this.userSocketMap);
  }

  public emitToUser(userId: string, event: string, data: any): boolean {
    const socketId = this.userSocketMap[userId];
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  public emitToUsers(userIds: string[], event: string, data: any): void {
    userIds.forEach((userId) => {
      const socketId = this.userSocketMap[userId];
      if (socketId) {
        this.io.to(socketId).emit(event, data);
      }
    });
  }
}

export let socketService: SocketService;

export const initializeSocketService = (io: Server): SocketService => {
  socketService = new SocketService(io);
  return socketService;
};
