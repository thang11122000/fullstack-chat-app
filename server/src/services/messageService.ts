import Message, { IMessage } from "../models/Message";
import User from "../models/User";
import { createError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import cloudinary from "../lib/cloudinary";

export interface CreateMessageData {
  senderId: string;
  receiverId: string;
  text?: string;
  image?: string;
}

export interface MessageResponse {
  _id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  image?: string;
  seen: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationResponse {
  messages: MessageResponse[];
  participants: {
    sender: any;
    receiver: any;
  };
}

export interface UnreadMessagesCount {
  [userId: string]: number;
}

export class MessageService {
  async createMessage(
    messageData: CreateMessageData
  ): Promise<MessageResponse> {
    try {
      // Validate that both users exist
      const [sender, receiver] = await Promise.all([
        User.findById(messageData.senderId),
        User.findById(messageData.receiverId),
      ]);

      if (!sender) {
        throw createError("Sender not found", 404);
      }

      if (!receiver) {
        throw createError("Receiver not found", 404);
      }

      // Handle image upload if provided
      let imageUrl: string | undefined;
      if (messageData.image) {
        try {
          const uploadResult = await cloudinary.uploader.upload(
            messageData.image,
            {
              folder: "chat-app/messages",
              resource_type: "auto",
              transformation: [
                { width: 800, height: 600, crop: "limit" },
                { quality: "auto" },
              ],
            }
          );
          imageUrl = uploadResult.secure_url;
        } catch (uploadError) {
          logger.error("Error uploading message image:", uploadError);
          throw createError("Failed to upload image", 400);
        }
      }

      // Validate that message has content
      if (!messageData.text && !imageUrl) {
        throw createError("Message must contain text or image", 400);
      }

      // Create message
      const message = new Message({
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
        text: messageData.text || undefined,
        image: imageUrl,
        seen: false,
      });

      await message.save();

      logger.info(
        `Message created: ${message._id} from ${messageData.senderId} to ${messageData.receiverId}`
      );

      return this.formatMessageResponse(message);
    } catch (error) {
      logger.error("Error creating message:", error);
      throw error;
    }
  }

  async getConversationMessages(
    userId: string,
    otherUserId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    messages: MessageResponse[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      // Validate that both users exist
      const [user, otherUser] = await Promise.all([
        User.findById(userId),
        User.findById(otherUserId),
      ]);

      if (!user || !otherUser) {
        throw createError("One or both users not found", 404);
      }

      const skip = (page - 1) * limit;

      // Get messages between the two users
      const [messages, total] = await Promise.all([
        Message.find({
          $or: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId },
          ],
        })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Message.countDocuments({
          $or: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId },
          ],
        }),
      ]);

      // Mark messages as seen (only messages sent to the current user)
      await this.markMessagesAsSeen(otherUserId, userId);

      const totalPages = Math.ceil(total / limit);

      return {
        messages: messages
          .reverse()
          .map((message) => this.formatMessageResponse(message)),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      logger.error("Error getting conversation messages:", error);
      throw error;
    }
  }

  async markMessagesAsSeen(
    senderId: string,
    receiverId: string
  ): Promise<void> {
    try {
      const result = await Message.updateMany(
        {
          senderId,
          receiverId,
          seen: false,
        },
        {
          seen: true,
        }
      );

      if (result.modifiedCount > 0) {
        logger.info(
          `Marked ${result.modifiedCount} messages as seen from ${senderId} to ${receiverId}`
        );
      }
    } catch (error) {
      logger.error("Error marking messages as seen:", error);
      throw error;
    }
  }

  async markSingleMessageAsSeen(
    messageId: string,
    userId: string
  ): Promise<void> {
    try {
      const message = await Message.findById(messageId);

      if (!message) {
        throw createError("Message not found", 404);
      }

      // Only the receiver can mark a message as seen
      if (message.receiverId.toString() !== userId) {
        throw createError("Unauthorized to mark this message as seen", 403);
      }

      if (!message.seen) {
        message.seen = true;
        await message.save();
        logger.info(`Message ${messageId} marked as seen by ${userId}`);
      }
    } catch (error) {
      logger.error("Error marking single message as seen:", error);
      throw error;
    }
  }

  async getUnreadMessagesCount(userId: string): Promise<UnreadMessagesCount> {
    try {
      const unreadMessages = await Message.aggregate([
        {
          $match: {
            receiverId: userId,
            seen: false,
          },
        },
        {
          $group: {
            _id: "$senderId",
            count: { $sum: 1 },
          },
        },
      ]);

      const unreadCount: UnreadMessagesCount = {};
      unreadMessages.forEach((item) => {
        unreadCount[item._id.toString()] = item.count;
      });

      return unreadCount;
    } catch (error) {
      logger.error("Error getting unread messages count:", error);
      throw error;
    }
  }

  async getUsersWithMessages(userId: string): Promise<{
    users: any[];
    unreadCount: UnreadMessagesCount;
  }> {
    try {
      // Get all users except the current user
      const users = await User.find({ _id: { $ne: userId } })
        .select("fullname email profilePic bio")
        .lean();

      // Get unread messages count
      const unreadCount = await this.getUnreadMessagesCount(userId);

      return {
        users,
        unreadCount,
      };
    } catch (error) {
      logger.error("Error getting users with messages:", error);
      throw error;
    }
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    try {
      const message = await Message.findById(messageId);

      if (!message) {
        throw createError("Message not found", 404);
      }

      // Only the sender can delete their message
      if (message.senderId.toString() !== userId) {
        throw createError("Unauthorized to delete this message", 403);
      }

      // Delete image from cloudinary if exists
      if (message.image) {
        try {
          const publicId = message.image.split("/").pop()?.split(".")[0];
          if (publicId) {
            await cloudinary.uploader.destroy(`chat-app/messages/${publicId}`);
          }
        } catch (deleteError) {
          logger.warn("Error deleting image from cloudinary:", deleteError);
        }
      }

      await Message.findByIdAndDelete(messageId);
      logger.info(`Message ${messageId} deleted by ${userId}`);
    } catch (error) {
      logger.error("Error deleting message:", error);
      throw error;
    }
  }

  private formatMessageResponse(message: IMessage | any): MessageResponse {
    return {
      _id: message._id.toString(),
      senderId: message.senderId.toString(),
      receiverId: message.receiverId.toString(),
      text: message.text,
      image: message.image,
      seen: message.seen,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }
}

export const messageService = new MessageService();
