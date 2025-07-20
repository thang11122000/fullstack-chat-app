import { createClient } from "redis";
import { logger } from "../utils/logger";
import dotenv from "dotenv";
dotenv.config();
class RedisService {
  private client: ReturnType<typeof createClient>;
  private isConnected = false;
  constructor() {
    this.client = createClient({
      username: "default",
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: process.env.REDIS_HOST,
        port: 10970,
      },
    });

    this.setupEventHandlers();
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
  }

  async connect() {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async disconnect() {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error("Redis get error:", error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.error("Redis set error:", error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error("Redis del error:", error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error("Redis exists error:", error);
      return false;
    }
  }

  // Cache methods for messages
  async cacheMessages(
    chatId: string,
    messages: any[],
    ttl: number = 300
  ): Promise<void> {
    const key = `chat:${chatId}:messages`;
    await this.set(key, JSON.stringify(messages), ttl);
  }

  async getCachedMessages(chatId: string): Promise<any[] | null> {
    const key = `chat:${chatId}:messages`;
    const cached = await this.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async invalidateChatCache(chatId: string): Promise<void> {
    const key = `chat:${chatId}:messages`;
    await this.del(key);
  }

  // Cache methods for user data
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
  }
}

export const redisService = new RedisService();
