import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import expressStaticGzip from "express-static-gzip";
import authRoutes from "./routes/auth";
import messageRoutes from "./routes/message";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";
import { redisService } from "./lib/redis";
import os from "os";
import { connectMongo } from "./lib/mongo";

export function createApp() {
  connectMongo();
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
      origin:
        process.env.NODE_ENV === "development"
          ? true
          : (origin, callback) => {
              if (!origin) return callback(null, true);

              const allowedOrigins = process.env.CLIENT_URL?.split(",") || [];

              if (allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
              } else {
                callback(new Error("Not allowed by CORS"));
              }
            },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(
    compression({
      level: 9, // Tăng level nén từ 6 lên 9 (maximum)
      threshold: 1024, // Chỉ nén files > 1KB
      filter: (req: any, res: any) => {
        if (req.headers["x-no-compression"]) {
          return false;
        }
        // Nén các file types quan trọng
        const compressible = compression.filter(req, res);
        return compressible;
      },
      // Configure Brotli compression with proper options
      brotli: {
        params: {
          // You can set Brotli parameters here using constants
          // For example, quality level (0-11, higher = better compression but slower)
          [require("zlib").constants.BROTLI_PARAM_QUALITY]: 11,
        },
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

  // Serve static files với compression headers
  if (process.env.NODE_ENV === "production") {
    const staticPath = path.join(__dirname, "../../client/dist");

    // Serve pre-compressed files với express-static-gzip
    app.use(
      "/",
      expressStaticGzip(staticPath, {
        enableBrotli: true,
        orderPreference: ["br", "gz"], // Ưu tiên Brotli trước
        serveStatic: {
          setHeaders: (res, path) => {
            // Cache static assets for 1 year, except HTML
            if (path.endsWith(".html")) {
              res.setHeader(
                "Cache-Control",
                "no-cache, no-store, must-revalidate"
              );
              res.setHeader("Pragma", "no-cache");
              res.setHeader("Expires", "0");
            } else {
              res.setHeader(
                "Cache-Control",
                "public, max-age=31536000, immutable"
              );
            }

            // Security headers for static assets
            res.setHeader("X-Content-Type-Options", "nosniff");
            res.setHeader("X-Frame-Options", "DENY");
          },
        },
        // Index fallback for SPA
        index: false,
      })
    );

    // Handle React Router - phải đặt sau static serving
    app.get("*", (req, res) => {
      res.sendFile(path.join(staticPath, "index.html"), {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
    });
  }

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
