import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User";
import Message from "../models/Message";
import { redisService } from "../lib/redis";
import { logger } from "../utils/logger";
import { SocketService } from "../services/socketService";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

// Optimized data structures for high concurrency
export const onlineUsers = new Map<string, Set<string>>();
export const userRooms = new Map<string, Set<string>>();
export const messageQueue = new Map<string, any[]>();

// Enhanced caching with TTL
const userAuthCache = new Map<string, { user: any; timestamp: number }>();
const AUTH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Batch processing configuration
const BATCH_SIZE = 50;
const BATCH_TIMEOUT = 100; // ms

// Connection pooling
const connectionPool = new Map<
  string,
  {
    socket: AuthenticatedSocket;
    lastActivity: number;
    messageCount: number;
  }
>();

// Rate limiting for socket events
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = { maxEvents: 100, windowMs: 60000 }; // 100 events per minute

async function emitOnlineUsers(io: Server) {
  try {
    const userIds = Array.from(onlineUsers.keys());
    // Use Redis pub/sub for distributed systems
    await redisService.publish("online_users_update", JSON.stringify(userIds));
    io.emit("getOnlineUsers", userIds);
  } catch (error) {
    logger.error("Error emitting online users:", error);
  }
}

async function authenticateSocket(
  socket: AuthenticatedSocket
): Promise<boolean> {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return false;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;

    // Check cache first
    const cached = userAuthCache.get(userId);
    if (cached && Date.now() - cached.timestamp < AUTH_CACHE_TTL) {
      socket.userId = userId;
      socket.user = cached.user;
      return true;
    }

    // If not in cache, fetch from database with Redis fallback
    let user = await redisService.getCachedUser(userId);
    if (!user) {
      user = await User.findById(userId).lean();
      if (user) {
        await redisService.cacheUser(userId, user);
      }
    }

    if (!user) {
      return false;
    }

    // Cache the user data
    userAuthCache.set(userId, { user, timestamp: Date.now() });
    socket.userId = userId;
    socket.user = user;
    return true;
  } catch (error) {
    logger.error("Socket authentication error:", error);
    return false;
  }
}

// Rate limiting function
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs,
    });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT.maxEvents) {
    return false;
  }

  userLimit.count++;
  return true;
}

// Batch message processing
async function processMessageBatch(chatId: string) {
  const messages = messageQueue.get(chatId) || [];
  if (messages.length === 0) return;

  try {
    // Use bulk operations for better performance
    const messageDocs = messages.map((msg) => ({
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      text: msg.text,
      image: msg.image,
      createdAt: new Date(),
    }));

    // Bulk insert messages
    const insertedMessages = await Message.insertMany(messageDocs);

    // Clear queue
    messageQueue.delete(chatId);

    // Emit batch messages
    return insertedMessages;
  } catch (error) {
    logger.error("Error processing message batch:", error);
    throw error;
  }
}

// Optimized message sending with queue
async function queueMessage(data: {
  senderId: string;
  receiverId: string;
  text?: string;
  image?: string;
  chatId?: string;
}) {
  const chatId = data.chatId || `${data.senderId}_${data.receiverId}`;

  if (!messageQueue.has(chatId)) {
    messageQueue.set(chatId, []);
  }

  messageQueue.get(chatId)!.push(data);

  // Process batch if size threshold reached
  if (messageQueue.get(chatId)!.length >= BATCH_SIZE) {
    return await processMessageBatch(chatId);
  }

  // Set timeout for processing remaining messages
  setTimeout(() => {
    processMessageBatch(chatId);
  }, BATCH_TIMEOUT);

  // Return null if message was queued
  return null;
}

export const setupSocketHandlers = (io: Server) => {
  // Enhanced authentication middleware with rate limiting
  io.use(async (socket: AuthenticatedSocket, next) => {
    const isAuthenticated = await authenticateSocket(socket);
    if (!isAuthenticated) {
      return next(new Error("Authentication error"));
    }

    // Check rate limit
    if (!checkRateLimit(socket.userId!)) {
      return next(new Error("Rate limit exceeded"));
    }

    next();
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    logger.info(`User ${socket.user?.fullname} connected`);

    // Add to connection pool
    connectionPool.set(socket.id, {
      socket,
      lastActivity: Date.now(),
      messageCount: 0,
    });

    if (socket.userId) {
      if (!onlineUsers.has(socket.userId)) {
        onlineUsers.set(socket.userId, new Set());
      }
      onlineUsers.get(socket.userId)!.add(socket.id);
      socket.join(socket.userId);
      emitOnlineUsers(io);
    }

    // Handle joining a chat room with optimization
    socket.on("join_chat", (chatId: string) => {
      socket.join(`chat_${chatId}`);

      if (!userRooms.has(socket.userId!)) {
        userRooms.set(socket.userId!, new Set());
      }
      userRooms.get(socket.userId!)!.add(chatId);

      logger.info(`User ${socket.user?.username} joined chat ${chatId}`);
    });

    // Handle leaving a chat room
    socket.on("leave_chat", (chatId: string) => {
      socket.leave(`chat_${chatId}`);

      const userRoomsSet = userRooms.get(socket.userId!);
      if (userRoomsSet) {
        userRoomsSet.delete(chatId);
      }

      logger.info(`User ${socket.user?.username} left chat ${chatId}`);
    });

    // Optimized message sending with queue and batch processing
    socket.on(
      "send_message",
      async (data: { receiverId: string; text?: string; image?: string }) => {
        try {
          const { receiverId, text, image } = data;

          // Update connection activity
          const connection = connectionPool.get(socket.id);
          if (connection) {
            connection.lastActivity = Date.now();
            connection.messageCount++;
          }

          // Validate message content
          if (!text && !image) {
            socket.emit("error", {
              message: "Message must contain text or image",
            });
            return;
          }

          // Queue message for batch processing
          const queuedMessage = await queueMessage({
            senderId: socket.userId!,
            receiverId,
            text,
            image,
            chatId: `${socket.userId}_${receiverId}`,
          });

          // If batch was processed immediately, emit results
          if (queuedMessage) {
            const lastMessage = queuedMessage[queuedMessage.length - 1];

            // Populate sender info
            await lastMessage.populate("senderId", "username avatar");

            // Emit to sender
            io.to(socket.userId!).emit("message_sent", {
              message: lastMessage,
              success: true,
            });

            // Emit to receiver if online using socket service
            const socketService = SocketService.getInstance();
            if (socketService && socketService.isUserOnline(receiverId)) {
              socketService.emitToOnlineUsers(
                [receiverId],
                "message_received",
                {
                  message: lastMessage,
                }
              );
            }
          } else {
            // Message queued, emit acknowledgment
            socket.emit("message_queued", {
              status: "queued",
              message: "Message queued for processing",
            });
          }

          // Invalidate cache
          const cacheKey = `conversation:${socket.userId}:${receiverId}:1:50`;
          await redisService.del(cacheKey);
        } catch (error) {
          logger.error("Error sending message:", error);
          socket.emit("error", { message: "Failed to send message" });
        }
      }
    );

    // Optimized batch read marking
    socket.on(
      "mark_as_read",
      async (data: { messageIds: string[]; senderId: string }) => {
        try {
          const { messageIds, senderId } = data;

          // Use bulk update for better performance
          const result = await Message.updateMany(
            {
              _id: { $in: messageIds },
              receiverId: socket.userId,
              seen: false,
            },
            {
              seen: true,
            }
          );

          if (result.modifiedCount > 0) {
            // Emit read receipt to sender using socket service
            const socketService = SocketService.getInstance();
            if (socketService && socketService.isUserOnline(senderId)) {
              socketService.emitToOnlineUsers([senderId], "messages_read", {
                messageIds,
                readBy: socket.userId,
                count: result.modifiedCount,
              });
            }

            // Invalidate cache
            const cacheKey = `conversation:${socket.userId}:${senderId}:1:50`;
            await redisService.del(cacheKey);
          }
        } catch (error) {
          logger.error("Error marking messages as read:", error);
          socket.emit("error", { message: "Failed to mark messages as read" });
        }
      }
    );

    // Optimized typing indicators with debouncing
    const typingTimers = new Map<string, NodeJS.Timeout>();

    socket.on("typing_start", (data: { receiverId: string }) => {
      const key = `${socket.userId}_${data.receiverId}`;

      // Clear existing timer
      if (typingTimers.has(key)) {
        clearTimeout(typingTimers.get(key)!);
      }

      io.to(data.receiverId).emit("user_typing", {
        userId: socket.userId,
        username: socket.user?.username,
        isTyping: true,
      });
    });

    socket.on("typing_stop", (data: { receiverId: string }) => {
      const key = `${socket.userId}_${data.receiverId}`;

      // Set timer to stop typing indicator
      const timer = setTimeout(() => {
        io.to(data.receiverId).emit("user_typing", {
          userId: socket.userId,
          username: socket.user?.username,
          isTyping: false,
        });
        typingTimers.delete(key);
      }, 1000);

      typingTimers.set(key, timer);
    });

    // Handle user disconnect with cleanup
    socket.on("disconnect", () => {
      logger.info(`User ${socket.user?.username} disconnected`);

      // Cleanup connection pool
      connectionPool.delete(socket.id);

      // Cleanup typing timers
      for (const [key, timer] of typingTimers.entries()) {
        if (key.startsWith(socket.userId!)) {
          clearTimeout(timer);
          typingTimers.delete(key);
        }
      }

      if (socket.userId) {
        const userSockets = onlineUsers.get(socket.userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            onlineUsers.delete(socket.userId);
          }
        }

        // Cleanup user rooms
        userRooms.delete(socket.userId);

        emitOnlineUsers(io);
      }
    });
  });

  // Periodic cleanup of inactive connections
  setInterval(() => {
    const now = Date.now();
    const inactiveTimeout = 5 * 60 * 1000; // 5 minutes

    for (const [socketId, connection] of connectionPool.entries()) {
      if (now - connection.lastActivity > inactiveTimeout) {
        connection.socket.disconnect();
        connectionPool.delete(socketId);
      }
    }
  }, 60000); // Check every minute
};
