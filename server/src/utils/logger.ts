import { createWriteStream, existsSync, mkdirSync } from "fs";
import { join } from "path";

export enum LogLevel {
  ERROR = "ERROR",
  WARN = "WARN",
  INFO = "INFO",
  DEBUG = "DEBUG",
}

class Logger {
  private logDir: string;

  constructor() {
    this.logDir = join(process.cwd(), "logs");
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  private log(level: LogLevel, message: string, meta?: any): void {
    const formattedMessage = this.formatMessage(level, message, meta);

    // Console output
    console.log(formattedMessage);

    // File output (only in production)
    if (process.env.NODE_ENV === "production") {
      const logFile = join(this.logDir, `${level.toLowerCase()}.log`);
      const stream = createWriteStream(logFile, { flags: "a" });
      stream.write(formattedMessage + "\n");
      stream.end();
    }
  }

  error(message: string, meta?: any): void {
    this.log(LogLevel.ERROR, message, meta);
  }

  warn(message: string, meta?: any): void {
    this.log(LogLevel.WARN, message, meta);
  }

  info(message: string, meta?: any): void {
    this.log(LogLevel.INFO, message, meta);
  }

  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV === "development") {
      this.log(LogLevel.DEBUG, message, meta);
    }
  }
}

export const logger = new Logger();
