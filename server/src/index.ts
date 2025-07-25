import { createApp } from "./app";
import cluster from "cluster";
import os from "os";
import { logger } from "./utils/logger";
import { Server } from "socket.io";
import { initializeSocketService } from "./services/socketService";

const numCPUs = os.cpus().length;
const isProduction = process.env.NODE_ENV === "production";
const isVercel = !!process.env.VERCEL;
console.log("isVercel", isVercel);
const app = createApp();

if (!isVercel) {
  if (cluster.isPrimary && isProduction) {
    logger.info(`Master ${process.pid} is running`);
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }
    cluster.on("exit", (worker, code, signal) => {
      logger.warn(`Worker ${worker.process.pid} died`);
      cluster.fork();
    });
    setInterval(() => {
      const workers = Object.values(cluster.workers || {});
      logger.info(`Active workers: ${workers.length}`);
    }, 30000);
  } else {
    const server = require("http").createServer(app);

    // Khởi tạo Socket.IO server
    const io = new Server(server, {
      cors: {
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
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"],
      allowEIO3: true,
    });

    // Khởi tạo Socket Service
    const socketService = initializeSocketService(io);
    socketService.initializeSocketHandlers();

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      logger.info(`Worker ${process.pid} started on port ${PORT}`);
      logger.info(`Socket.IO server initialized on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  }
}

export default app;
