import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { setupSocketHandlers } from "./socket/socketHandlers";
import { connectDB } from "./lib/database";
import { redisService } from "./lib/redis";
import authRoutes from "./routes/auth";
import messageRoutes from "./routes/message";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Single Socket.io instance configuration with optimizations
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
  // Socket.io performance optimizations
  transports: ["websocket", "polling"],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6, // 1MB
  allowRequest: (req, callback) => {
    // Add rate limiting for socket connections
    callback(null, true);
  },
});

const PORT = process.env.PORT || 3000;

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 1000,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Specific rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  message: "Too many authentication attempts, please try again later.",
});

// Global middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// Compression middleware
app.use(
  compression({
    level: 6, // Compression level (0-9)
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req: any, res: any) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware with performance tracking
app.use((req, res, next) => {
  const start = Date.now();
  logger.info(`${req.method} ${req.path} - ${req.ip}`);

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(
      `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`
    );
  });

  next();
});

// API Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/messages", messageRoutes);

// Health check endpoint with Redis status
app.get("/api/health", async (req, res) => {
  try {
    const redisStatus = await redisService.exists("health_check");
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      redis: redisStatus ? "connected" : "disconnected",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use(errorHandler);

// Socket.io setup
setupSocketHandlers(io);

// Database connection
connectDB();

// Redis connection
redisService.connect().catch((err) => {
  logger.error("Failed to connect to Redis:", err);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");

  // Close Redis connection
  await redisService.disconnect();

  server.close(() => {
    logger.info("Process terminated");
    process.exit(0);
  });
});

// Start server
if (process.env.NODE_ENV !== "production") {
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Socket.io server ready`);
    logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
  });
}

export { io };
export default server;
