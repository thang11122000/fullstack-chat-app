import mongoose from "mongoose";

export const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI;

  try {
    mongoose.connection.on("connected", () => {
      console.log("MongoDB connected successfully");
    });

    await mongoose.connect(MONGODB_URI!);
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
