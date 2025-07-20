import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth";
import messageRoutes from "./routes/message";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";
import { redisService } from "./lib/redis";
import os from "os";

export function createApp() {
  const app = express();

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

  app.use(
    cors({
      origin: process.env.CLIENT_URL,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(
    compression({
      level: 6,
      threshold: 1024,
      filter: (req: any, res: any) => {
        if (req.headers["x-no-compression"]) {
          return false;
        }
        return compression.filter(req, res);
      },
    })
  );

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

  app.use("/api/auth", authLimiter, authRoutes);
  app.use("/api/messages", messageRoutes);

  app.get("/", (req, res) => {
    res.json({
      message: "Server is running!",
      status: true,
    });
  });

  app.get("/api/health", async (req, res) => {
    try {
      const startTime = Date.now();
      const redisHealth = await redisService.exists("health_check");
      const memUsage = process.memoryUsage();
      const responseTime = Date.now() - startTime;
      res.json({
        status: true,
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
          active: 0,
          total: 0,
        },
      };
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to get metrics" });
    }
  });

  app.use("*", (req, res) => {
    res.status(404).json({
      success: false,
      message: "Route not found",
      path: req.originalUrl,
    });
  });

  app.use(errorHandler);

  return app;
}
