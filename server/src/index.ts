import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import cors from "cors";
import dotenv from "dotenv";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cluster from "cluster";
import os from "os";
import { setupSocketHandlers } from "./socket/socketHandlers";
import { redisService } from "./lib/redis";
import authRoutes from "./routes/auth";
import messageRoutes from "./routes/message";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";
import { SocketService } from "./services/socketService";
import { connectMongo, disconnectMongo } from "./lib/mongo";

// Load environment variables
dotenv.config();

// Clustering for better performance
const numCPUs = os.cpus().length;
const isProduction = process.env.NODE_ENV === "production";

if (cluster.isPrimary && isProduction) {
  logger.info(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died`);
    // Replace the dead worker
    cluster.fork();
  });

  // Monitor cluster health
  setInterval(() => {
    const workers = Object.values(cluster.workers || {});
    logger.info(`Active workers: ${workers.length}`);
  }, 30000);
} else {
  // Worker process
  const app = express();
  const server = createServer(app);

  // Kết nối MongoDB khi khởi động
  connectMongo();

  // Enhanced Socket.io configuration for high concurrency
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Performance optimizations
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

  // Setup Redis adapter for clustering
  const pubClient = redisService.getClient();
  const subClient = pubClient.duplicate();

  io.adapter(createAdapter(pubClient, subClient));

  const PORT = process.env.PORT || 3000;

  // Enhanced security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  // Enhanced rate limiting
  const limiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === "/api/health";
    },
  });

  app.use(limiter);

  // Specific rate limiting for auth routes
  const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 100,
    message: "Too many authentication attempts, please try again later.",
    skipSuccessfulRequests: true,
  });

  // Global middleware
  app.use(
    cors({
      origin: process.env.CLIENT_URL,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Enhanced compression middleware
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

  // Enhanced body parsing
  app.use(
    express.json({
      limit: "10mb",
      verify: (req: any, res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(
    express.urlencoded({
      extended: true,
      limit: "10mb",
      parameterLimit: 1000,
    })
  );

  // Enhanced request logging middleware with performance tracking
  app.use((req: any, res, next) => {
    const start = Date.now();
    const requestId = Math.random().toString(36).substring(7);

    req.requestId = requestId;
    logger.info(`${req.method} ${req.path} - ${req.ip} - [${requestId}]`);

    res.on("finish", () => {
      const duration = Date.now() - start;
      const logLevel = duration > 1000 ? "warn" : "info";

      logger[logLevel](
        `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - [${requestId}]`
      );
    });

    next();
  });

  // API Routes with enhanced error handling
  app.use("/api/auth", authLimiter, authRoutes);
  app.use("/api/messages", messageRoutes);

  // Enhanced health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const startTime = Date.now();

      // Check Redis health
      const redisHealth = await redisService.exists("health_check");

      // Check memory usage
      const memUsage = process.memoryUsage();

      const responseTime = Date.now() - startTime;

      res.json({
        status: true, // Assuming redis health is sufficient for now
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        worker: process.pid,
        uptime: process.uptime(),
        responseTime: `${responseTime}ms`,
        services: {
          redis: redisHealth ? "connected" : "disconnected",
        },
        memory: {
          rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
          external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
        },
        system: {
          cpu: process.cpuUsage(),
          load: os.loadavg(),
        },
      });
    } catch (error) {
      res.status(500).json({
        status: "ERROR",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Performance monitoring endpoint
  app.get("/api/metrics", async (req, res) => {
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        worker: process.pid,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        system: {
          load: os.loadavg(),
          freeMemory: os.freemem(),
          totalMemory: os.totalmem(),
        },
        connections: {
          active: io.engine.clientsCount,
          total: io.engine.clientsCount,
        },
      };

      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to get metrics" });
    }
  });

  // 404 handler
  app.use("*", (req, res) => {
    res.status(404).json({
      success: false,
      message: "Route not found",
      path: req.originalUrl,
    });
  });

  // Global error handler
  app.use(errorHandler);

  // Socket.io setup - use only SocketService to avoid conflicts
  const socketService = new SocketService(io);
  socketService.initializeSocketHandlers();

  // Log to verify SocketService is initialized
  // Redis connection
  redisService.connect().catch((err) => {
    logger.error("Failed to connect to Redis:", err);
  });

  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully`);

    // Close Redis connection
    await redisService.disconnect();

    // Đóng kết nối MongoDB
    await disconnectMongo();

    // Close server
    server.close(() => {
      logger.info("Process terminated");
      process.exit(0);
    });

    // Force exit after 30 seconds
    setTimeout(() => {
      logger.error(
        "Could not close connections in time, forcefully shutting down"
      );
      process.exit(1);
    }, 30000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  // Handle uncaught exceptions
  process.on("uncaughtException", (error) => {
    logger.error("Uncaught Exception:", error);
    gracefulShutdown("UNCAUGHT_EXCEPTION");
  });

  process.on("unhandledRejection", (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
    gracefulShutdown("UNHANDLED_REJECTION");
  });

  // Start server
  server.listen(PORT, () => {
    logger.info(`Worker ${process.pid} started on port ${PORT}`);
    logger.info(`Socket.io server ready`);
    logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
  });
}
