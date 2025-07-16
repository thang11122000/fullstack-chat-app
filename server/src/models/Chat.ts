import mongoose, { Document, Schema } from "mongoose";

export interface IChat extends Document {
  participants: mongoose.Types.ObjectId[];
  lastMessage: mongoose.Types.ObjectId;
  lastMessageTime: Date;
  unreadCount: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<IChat>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    lastMessageTime: {
      type: Date,
      default: Date.now,
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map(),
    },
  },
  {
    timestamps: true,
  }
);

// Ensure exactly 2 participants for private chats
chatSchema.pre("save", function (next) {
  if (this.participants.length !== 2) {
    return next(new Error("Private chat must have exactly 2 participants"));
  }
  next();
});

// Index for better query performance
chatSchema.index({ participants: 1 });
chatSchema.index({ lastMessageTime: -1 });

export default mongoose.model<IChat>("Chat", chatSchema);
