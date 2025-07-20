import mongoose, { Document, Schema } from "mongoose";

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  text?: string;
  image?: string;
  seen: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index for faster queries
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index for faster queries
    },
    text: {
      type: String,
      trim: true,
      maxlength: 5000, // Limit message length
    },
    image: {
      type: String,
      trim: true,
    },
    seen: {
      type: Boolean,
      default: false,
      index: true, // Index for unread messages queries
    },
  },
  {
    timestamps: true,
    // Optimize for read-heavy workloads
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for better query performance
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 }); // For conversation history
messageSchema.index({ receiverId: 1, seen: 1, createdAt: -1 }); // For unread messages
messageSchema.index({ senderId: 1, createdAt: -1 }); // For user's sent messages
messageSchema.index({ receiverId: 1, createdAt: -1 }); // For user's received messages
messageSchema.index({ createdAt: -1 }); // For pagination and time-based queries

// Partial indexes for better performance
messageSchema.index(
  { seen: 1, createdAt: -1 },
  { partialFilterExpression: { seen: false } }
); // Only index unread messages

messageSchema.index(
  { image: 1, createdAt: -1 },
  { partialFilterExpression: { image: { $exists: true, $ne: null } } }
); // Only index messages with images

// Text index for search functionality
messageSchema.index(
  { text: "text" },
  {
    weights: {
      text: 10,
    },
    name: "message_text_search",
  }
);

// Virtual for message age
messageSchema.virtual("age").get(function (this: any) {
  return Date.now() - this.createdAt.getTime();
});

// Virtual for isRecent (within last 24 hours)
messageSchema.virtual("isRecent").get(function (this: any) {
  return this.age < 24 * 60 * 60 * 1000;
});

// Virtual for hasContent
messageSchema.virtual("hasContent").get(function (this: any) {
  return !!(this.text || this.image);
});

// Pre-save middleware for optimization
messageSchema.pre("save", function (next) {
  // Validate that message has content
  if (!this.text && !this.image) {
    return next(new Error("Message must contain text or image"));
  }

  next();
});

// Static methods for optimized queries
messageSchema.statics.findConversation = function (
  senderId: string,
  receiverId: string,
  limit = 50,
  skip = 0
) {
  return this.find({
    $or: [
      { senderId: senderId, receiverId: receiverId },
      { senderId: receiverId, receiverId: senderId },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate("senderId", "username avatar")
    .populate("receiverId", "username avatar")
    .lean();
};

messageSchema.statics.findUnreadMessages = function (userId: string) {
  return this.find({
    receiverId: userId,
    seen: false,
  })
    .sort({ createdAt: -1 })
    .populate("senderId", "username avatar")
    .lean();
};

messageSchema.statics.markAsSeen = function (
  messageIds: string[],
  userId: string
) {
  return this.updateMany(
    {
      _id: { $in: messageIds },
      receiverId: userId,
      seen: false,
    },
    {
      seen: true,
    }
  );
};

messageSchema.statics.getMessageStats = function (userId: string) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { senderId: new mongoose.Types.ObjectId(userId) },
          { receiverId: new mongoose.Types.ObjectId(userId) },
        ],
      },
    },
    {
      $group: {
        _id: null,
        totalMessages: { $sum: 1 },
        sentMessages: {
          $sum: {
            $cond: [
              { $eq: ["$senderId", new mongoose.Types.ObjectId(userId)] },
              1,
              0,
            ],
          },
        },
        receivedMessages: {
          $sum: {
            $cond: [
              { $eq: ["$receiverId", new mongoose.Types.ObjectId(userId)] },
              1,
              0,
            ],
          },
        },
        unreadMessages: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$receiverId", new mongoose.Types.ObjectId(userId)] },
                  { $eq: ["$seen", false] },
                ],
              },
              1,
              0,
            ],
          },
        },
        imageMessages: {
          $sum: {
            $cond: [{ $ne: ["$image", null] }, 1, 0],
          },
        },
      },
    },
  ]);
};

// Get unread count by sender
messageSchema.statics.getUnreadCountBySender = function (userId: string) {
  return this.aggregate([
    {
      $match: {
        receiverId: new mongoose.Types.ObjectId(userId),
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
};

// Instance methods
messageSchema.methods.markAsSeen = function () {
  this.seen = true;
  return this.save();
};

// Optimize for bulk operations
messageSchema.statics.bulkInsert = function (messages: any[]) {
  return this.insertMany(messages, { ordered: false });
};

messageSchema.statics.bulkUpdate = function (filter: any, update: any) {
  return this.updateMany(filter, update);
};

// Get conversation participants
messageSchema.statics.getConversationParticipants = function (userId: string) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { senderId: new mongoose.Types.ObjectId(userId) },
          { receiverId: new mongoose.Types.ObjectId(userId) },
        ],
      },
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ["$senderId", new mongoose.Types.ObjectId(userId)] },
            "$receiverId",
            "$senderId",
          ],
        },
        lastMessage: { $last: "$$ROOT" },
        messageCount: { $sum: 1 },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$receiverId", new mongoose.Types.ObjectId(userId)] },
                  { $eq: ["$seen", false] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $sort: { "lastMessage.createdAt": -1 },
    },
  ]);
};

export default mongoose.model<IMessage>("Message", messageSchema);
