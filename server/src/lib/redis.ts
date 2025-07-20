import { createClient } from "redis";
import { logger } from "../utils/logger";
import dotenv from "dotenv";
dotenv.config();

class RedisService {
  private client: ReturnType<typeof createClient>;
  private subscriber: ReturnType<typeof createClient>;
  private publisher: ReturnType<typeof createClient>;
  private isConnected = false;
  private connectionPool: ReturnType<typeof createClient>[] = [];
  private maxPoolSize = 10;
  private currentPoolSize = 0;

  constructor() {
    this.client = createClient({
      username: "default",
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || "10970"),
        connectTimeout: 10000,
      },
    });

    this.subscriber = this.client.duplicate();
    this.publisher = this.client.duplicate();

    this.setupEventHandlers();
    this.setupPubSub();
  }

  private setupEventHandlers() {
    this.client.on("connect", () => {
      logger.info("Redis connected");
      this.isConnected = true;
    });

    this.client.on("error", (err: Error) => {
      logger.error("Redis error:", err);
      this.isConnected = false;
    });

    this.client.on("end", () => {
      logger.info("Redis disconnected");
      this.isConnected = false;
    });

    this.client.on("ready", () => {
      logger.info("Redis ready");
    });
  }

  private setupPubSub() {
    this.subscriber.on("message", (channel, message) => {
      logger.info(`Redis Pub/Sub: ${channel} - ${message}`);

      // Handle different message types
      switch (channel) {
        case "online_users_update":
          // Handle online users update
          break;
        case "message_broadcast":
          // Handle message broadcast
          break;
        case "cache_invalidation":
          // Handle cache invalidation
          break;
      }
    });

    this.subscriber.on("error", (err) => {
      logger.error("Redis subscriber error:", err);
    });
  }

  async connect() {
    if (!this.isConnected) {
      await Promise.all([
        this.client.connect(),
        this.subscriber.connect(),
        this.publisher.connect(),
      ]);

      // Subscribe to channels
      await this.subscriber.subscribe("online_users_update", (message) => {
        logger.info(`Online users update: ${message}`);
      });
      await this.subscriber.subscribe("message_broadcast", (message) => {
        logger.info(`Message broadcast: ${message}`);
      });
      await this.subscriber.subscribe("cache_invalidation", (message) => {
        logger.info(`Cache invalidation: ${message}`);
      });
    }
  }

  async disconnect() {
    if (this.isConnected) {
      await Promise.all([
        this.client.disconnect(),
        this.subscriber.disconnect(),
        this.publisher.disconnect(),
      ]);

      // Close connection pool
      for (const conn of this.connectionPool) {
        await conn.disconnect();
      }
      this.connectionPool = [];
    }
  }

  // Connection pooling for high concurrency
  private async getConnection() {
    if (this.connectionPool.length > 0) {
      return this.connectionPool.pop()!;
    }

    if (this.currentPoolSize < this.maxPoolSize) {
      const conn = this.client.duplicate();
      await conn.connect();
      this.currentPoolSize++;
      return conn;
    }

    // Wait for available connection
    return new Promise<ReturnType<typeof createClient>>((resolve) => {
      const checkPool = () => {
        if (this.connectionPool.length > 0) {
          resolve(this.connectionPool.pop()!);
        } else {
          setTimeout(checkPool, 10);
        }
      };
      checkPool();
    });
  }

  private async releaseConnection(conn: ReturnType<typeof createClient>) {
    if (this.connectionPool.length < this.maxPoolSize) {
      this.connectionPool.push(conn);
    } else {
      await conn.disconnect();
      this.currentPoolSize--;
    }
  }

  async get(key: string): Promise<string | null> {
    const conn = await this.getConnection();
    try {
      return await conn.get(key);
    } catch (error) {
      logger.error("Redis get error:", error);
      return null;
    } finally {
      await this.releaseConnection(conn);
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    const conn = await this.getConnection();
    try {
      if (ttl) {
        await conn.setEx(key, ttl, value);
      } else {
        await conn.set(key, value);
      }
    } catch (error) {
      logger.error("Redis set error:", error);
    } finally {
      await this.releaseConnection(conn);
    }
  }

  async del(key: string): Promise<void> {
    const conn = await this.getConnection();
    try {
      await conn.del(key);
    } catch (error) {
      logger.error("Redis del error:", error);
    } finally {
      await this.releaseConnection(conn);
    }
  }

  async exists(key: string): Promise<boolean> {
    const conn = await this.getConnection();
    try {
      const result = await conn.exists(key);
      return result === 1;
    } catch (error) {
      logger.error("Redis exists error:", error);
      return false;
    } finally {
      await this.releaseConnection(conn);
    }
  }

  // Pub/Sub methods
  async publish(channel: string, message: string): Promise<void> {
    try {
      await this.publisher.publish(channel, message);
    } catch (error) {
      logger.error("Redis publish error:", error);
    }
  }

  async subscribe(
    channel: string,
    callback: (message: string) => void
  ): Promise<void> {
    try {
      await this.subscriber.subscribe(channel, (message) => {
        callback(message);
      });
    } catch (error) {
      logger.error("Redis subscribe error:", error);
    }
  }

  // Enhanced caching methods with compression
  async cacheMessages(
    chatId: string,
    messages: any[],
    ttl: number = 300
  ): Promise<void> {
    const key = `chat:${chatId}:messages`;
    const compressed = JSON.stringify(messages);
    await this.set(key, compressed, ttl);
  }

  async getCachedMessages(chatId: string): Promise<any[] | null> {
    const key = `chat:${chatId}:messages`;
    const cached = await this.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async invalidateChatCache(chatId: string): Promise<void> {
    const key = `chat:${chatId}:messages`;
    await this.del(key);
    // Notify other instances
    await this.publish(
      "cache_invalidation",
      JSON.stringify({ type: "chat", id: chatId })
    );
  }

  // Enhanced user caching with partial updates
  async cacheUser(
    userId: string,
    userData: any,
    ttl: number = 600
  ): Promise<void> {
    const key = `user:${userId}`;
    await this.set(key, JSON.stringify(userData), ttl);
  }

  async getCachedUser(userId: string): Promise<any | null> {
    const key = `user:${userId}`;
    const cached = await this.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async invalidateUserCache(userId: string): Promise<void> {
    const key = `user:${userId}`;
    await this.del(key);
    await this.publish(
      "cache_invalidation",
      JSON.stringify({ type: "user", id: userId })
    );
  }

  // Message queue methods
  async enqueueMessage(queueName: string, message: any): Promise<void> {
    const key = `queue:${queueName}`;
    await this.client.lPush(key, JSON.stringify(message));
  }

  async dequeueMessage(queueName: string): Promise<any | null> {
    const key = `queue:${queueName}`;
    const message = await this.client.rPop(key);
    return message ? JSON.parse(message) : null;
  }

  async getQueueLength(queueName: string): Promise<number> {
    const key = `queue:${queueName}`;
    return await this.client.lLen(key);
  }

  // Rate limiting methods
  async checkRateLimit(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<boolean> {
    const now = Date.now();
    const windowKey = `rate_limit:${key}:${Math.floor(now / windowMs)}`;

    const current = await this.client.incr(windowKey);
    if (current === 1) {
      await this.client.expire(windowKey, Math.ceil(windowMs / 1000));
    }

    return current <= limit;
  }

  // Session management
  async setSession(
    sessionId: string,
    data: any,
    ttl: number = 3600
  ): Promise<void> {
    const key = `session:${sessionId}`;
    await this.set(key, JSON.stringify(data), ttl);
  }

  async getSession(sessionId: string): Promise<any | null> {
    const key = `session:${sessionId}`;
    const cached = await this.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await this.del(key);
  }

  // Online users management
  async addOnlineUser(userId: string, socketId: string): Promise<void> {
    const key = `online_users:${userId}`;
    await this.client.sAdd(key, socketId);
    await this.client.expire(key, 300); // 5 minutes TTL
  }

  async removeOnlineUser(userId: string, socketId: string): Promise<void> {
    const key = `online_users:${userId}`;
    await this.client.sRem(key, socketId);
  }

  async getOnlineUserSockets(userId: string): Promise<string[]> {
    const key = `online_users:${userId}`;
    return await this.client.sMembers(key);
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const key = `online_users:${userId}`;
    const count = await this.client.sCard(key);
    return count > 0;
  }

  // Performance monitoring
  async getStats(): Promise<any> {
    const info = await this.client.info();

    return {
      info,
      poolSize: this.currentPoolSize,
      availableConnections: this.connectionPool.length,
    };
  }

  // Get Redis client for Socket.IO adapter
  getClient() {
    return this.client;
  }
}

export const redisService = new RedisService();
