import mongoose, { Document, Schema } from "mongoose";

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  text: string;
  image: string;
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
    },
    image: {
      type: String,
    },
    seen: {
      type: Boolean,
      default: false,
      index: true, // Index for unread messages queries
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for better query performance
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, seen: 1, createdAt: -1 });
messageSchema.index({ createdAt: -1 }); // For pagination

// Text index for search functionality (if needed)
// messageSchema.index({ text: "text" });

export default mongoose.model<IMessage>("Message", messageSchema);
