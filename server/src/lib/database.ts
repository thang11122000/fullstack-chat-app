import mongoose from "mongoose";

export const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI;

  try {
    // Configure mongoose for better performance
    mongoose.set("strictQuery", false);

    // Connection options for better performance
    const options = {
      maxPoolSize: 10, // Maximum number of connections in the pool
      minPoolSize: 2, // Minimum number of connections in the pool
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
      socketTimeoutMS: 45000, // Socket timeout
      bufferCommands: false, // Disable mongoose buffering
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      compressors: ["zlib" as const], // Enable compression
      zlibCompressionLevel: 6 as const, // Compression level
    };

    mongoose.connection.on("connected", () => {
      console.log("MongoDB connected successfully");
    });

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
    });

    await mongoose.connect(MONGODB_URI!, options);
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
