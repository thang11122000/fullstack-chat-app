# 🚀 Chat Application - Backend

High-performance Node.js server for real-time chat application with capability to handle thousands of concurrent users.

## 🏗️ Architecture

### Technology Stack

- **Runtime**: Node.js 16+ with TypeScript
- **Framework**: Express.js with Socket.IO
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis with connection pooling
- **Authentication**: JWT with bcrypt
- **File Upload**: Cloudinary integration
- **Logging**: Winston with structured logging
- **Validation**: express-validator with Joi

### Key Features

#### 🔌 Real-time Communication

- Socket.IO with WebSocket and polling fallback
- Redis adapter for horizontal scaling
- Connection pooling and rate limiting
- Debounced typing indicators
- Optimized event handling

#### 🗄️ Database Optimization

- MongoDB connection pooling (50 connections)
- Compound indexes for performance
- Bulk operations and lean queries
- Query monitoring and slow query detection
- Automatic retry with exponential backoff

#### ⚡ Performance Features

- Node.js clustering with load balancing
- Redis caching with TTL
- Message queue with batch processing
- Compression middleware
- Rate limiting and security headers

#### 📊 Monitoring & Analytics

- Real-time performance metrics
- Health check endpoints
- CPU, Memory, Database monitoring
- Alert system with configurable thresholds
- Historical data storage

## 🛠️ Installation

### Prerequisites

```bash
Node.js >= 16.0.0
MongoDB >= 5.0
Redis >= 6.0
npm >= 8.0.0
```

### Setup

```bash
# Clone and navigate
git clone <repository-url>
cd chat-app/server

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### Environment Configuration

Create `.env` file:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/chatapp

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_super_secret_jwt_key_here

# Cloudinary (Optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Performance Settings
MAX_CONNECTIONS=50
REDIS_POOL_SIZE=10
BATCH_SIZE=50
PROCESSING_INTERVAL=100
```

## 🚀 Running the Server

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

### Other Commands

```bash
# Linting
npm run lint
npm run lint:fix

# Testing
npm test
```

## 📁 Project Structure

```
server/
├── src/
│   ├── controllers/          # Route controllers
│   │   ├── user.controller.ts
│   │   └── message.controller.ts
│   ├── middleware/           # Express middleware
│   │   ├── auth.ts
│   │   └── validation.ts
│   ├── models/              # MongoDB models
│   │   ├── User.ts
│   │   ├── Message.ts
│   │   └── Chat.ts
│   ├── routes/              # API routes
│   │   ├── auth.ts
│   │   ├── message.ts
│   │   └── chat.ts
│   ├── services/            # Business logic
│   │   └── socketService.ts
│   ├── socket/              # Socket.IO handlers
│   │   └── socketHandlers.ts
│   ├── utils/               # Utility functions
│   │   └── logger.ts
│   ├── lib/                 # External integrations
│   │   ├── redis.ts
│   │   └── cloudinary.ts
│   ├── app.ts               # Express app setup
│   └── index.ts             # Server entry point
├── dist/                    # Compiled JavaScript
├── logs/                    # Application logs
├── scripts/                 # Utility scripts
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 API Documentation

### Authentication Endpoints

```
POST /api/auth/signup       # User registration
POST /api/auth/login        # User login
POST /api/auth/logout       # User logout
GET  /api/auth/check        # Check authentication status
PUT  /api/auth/profile      # Update user profile
```

### Message Endpoints

```
GET  /api/messages/users                # Get users for sidebar
GET  /api/messages/conversation/:id     # Get conversation messages
POST /api/messages/send/:id             # Send message
PUT  /api/messages/mark-seen/:id        # Mark message as read
DELETE /api/messages/:id                # Delete message
GET  /api/messages/unread-count         # Get unread messages count
```

### Chat Endpoints

```
GET  /api/chat                          # Get user's chat list
GET  /api/chat/:chatId/messages         # Get messages in chat
POST /api/chat/create                   # Create new chat
GET  /api/chat/users/search             # Search users
PUT  /api/chat/:chatId/read             # Mark messages as read
GET  /api/chat/unread-count             # Get unread count
```

### Health & Monitoring

```
GET  /api/health                        # System health check
GET  /api/metrics                       # Performance metrics
GET  /api/queue/stats                   # Message queue statistics
```

## 🔌 Socket.IO Events

### Client → Server Events

```javascript
// Connection management
"join_chat"; // Join a chat room
"leave_chat"; // Leave a chat room

// Messaging
"send_message"; // Send a new message
"mark_as_read"; // Mark messages as read

// Typing indicators
"typing_start"; // Start typing indicator
"typing_stop"; // Stop typing indicator
```

### Server → Client Events

```javascript
// Message events
"message_sent"; // Message successfully sent
"message_received"; // New message received
"messages_read"; // Messages marked as read
"message_queued"; // Message queued for processing

// Chat updates
"chat_updated"; // Chat room updated
"user_typing"; // User typing indicator

// User status
"getOnlineUsers"; // Online users list
"user_connected"; // User came online
"user_disconnected"; // User went offline
```

## 🗄️ Database Schema

### User Model

```javascript
{
  _id: ObjectId,
  fullname: String (required),
  email: String (unique, required),
  password: String (hashed, required),
  profilePic: String (optional),
  bio: String (optional),
  isOnline: Boolean (default: false),
  lastSeen: Date (default: Date.now),
  createdAt: Date,
  updatedAt: Date
}
```

### Message Model

```javascript
{
  _id: ObjectId,
  senderId: ObjectId (ref: User, required),
  receiverId: ObjectId (ref: User, required),
  text: String (optional, max: 5000),
  image: String (optional),
  seen: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

### Chat Model

```javascript
{
  _id: ObjectId,
  participants: [ObjectId] (ref: User, required),
  lastMessage: ObjectId (ref: Message),
  lastMessageTime: Date (default: Date.now),
  unreadCount: Map<String, Number>,
  createdAt: Date,
  updatedAt: Date
}
```

### Database Indexes

```javascript
// Message indexes for performance
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, seen: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, createdAt: -1 });
messageSchema.index({ createdAt: -1 });

// Partial indexes for unread messages
messageSchema.index(
  { seen: 1, createdAt: -1 },
  { partialFilterExpression: { seen: false } }
);

// Text search index
messageSchema.index({ text: "text" }, { weights: { text: 10 } });

// Chat indexes
chatSchema.index({ participants: 1 });
chatSchema.index({ lastMessageTime: -1 });

// User indexes
userSchema.index({ email: 1 });
userSchema.index({ isOnline: 1, lastSeen: -1 });
```

## ⚡ Performance Configuration

### Connection Pooling

```javascript
// MongoDB
mongoose.connect(MONGODB_URI, {
  maxPoolSize: 50,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
});

// Redis
const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  lazyConnect: true,
});
```

### Socket.IO Optimization

```javascript
const io = new Server(server, {
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6,
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
});

// Redis adapter for scaling
io.adapter(createAdapter(pubClient, subClient));
```

### Message Queue & Batch Processing

```javascript
// Batch processing configuration
const BATCH_SIZE = 50;
const BATCH_TIMEOUT = 100; // ms

// Queue message for batch processing
async function queueMessage(data) {
  const chatId = `${data.senderId}_${data.receiverId}`;

  if (!messageQueue.has(chatId)) {
    messageQueue.set(chatId, []);
  }

  messageQueue.get(chatId).push(data);

  // Process batch if size threshold reached
  if (messageQueue.get(chatId).length >= BATCH_SIZE) {
    return await processMessageBatch(chatId);
  }

  // Set timeout for processing remaining messages
  setTimeout(() => {
    processMessageBatch(chatId);
  }, BATCH_TIMEOUT);
}
```

## 📊 Monitoring

### Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "services": {
    "database": "connected",
    "redis": "connected",
    "memory": {
      "used": "256MB",
      "free": "768MB",
      "usage": "25%"
    },
    "cpu": {
      "usage": "15%",
      "load": [0.5, 0.3, 0.2]
    }
  }
}
```

### Performance Metrics

```json
{
  "connections": {
    "active": 1250,
    "total": 15000
  },
  "messages": {
    "sent": 50000,
    "queued": 25,
    "failed": 2
  },
  "database": {
    "queries": 1000,
    "slow_queries": 5,
    "avg_response_time": "45ms"
  },
  "redis": {
    "connected": true,
    "memory_usage": "128MB",
    "keys": 5000
  }
}
```

## 🔒 Security Features

### Authentication & Authorization

```javascript
// JWT middleware
export const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Access denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};
```

### Rate Limiting

```javascript
// Socket rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT = { maxEvents: 100, windowMs: 60000 };

function checkRateLimit(userId) {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs,
    });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT.maxEvents) {
    return false;
  }

  userLimit.count++;
  return true;
}
```

### Input Validation

```javascript
// Message validation
const messageValidation = [
  body("text")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Message text must be between 1 and 1000 characters"),
  body("image")
    .optional()
    .isString()
    .withMessage("Image must be a valid base64 string"),
];
```

## 🐳 Deployment

### Docker Configuration

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start application
CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/chatapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:6.2-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  mongo_data:
  redis_data:
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-frontend-domain.com
MONGODB_URI=mongodb://your-mongo-host:27017/chatapp
REDIS_URL=redis://your-redis-host:6379
JWT_SECRET=your-super-secure-jwt-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 🧪 Testing

### Unit Tests

```javascript
// __tests__/controllers/auth.test.js
describe("Auth Controller", () => {
  describe("POST /api/auth/login", () => {
    it("should login user with valid credentials", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("user");
    });
  });
});
```

### Integration Tests

```javascript
// __tests__/socket/messaging.test.js
describe("Socket Messaging", () => {
  it("should send and receive messages", (done) => {
    const client1 = io("http://localhost:5000");
    const client2 = io("http://localhost:5000");

    client2.on("message_received", (message) => {
      expect(message.text).toBe("Hello World");
      client1.disconnect();
      client2.disconnect();
      done();
    });

    client1.emit("send_message", {
      receiverId: "user2",
      text: "Hello World",
    });
  });
});
```

## 📈 Performance Monitoring

### Winston Logger Configuration

```javascript
// utils/logger.ts
import winston from "winston";

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "chat-app" },
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}
```

### Metrics Collection

```javascript
// utils/metrics.ts
export class MetricsCollector {
  private static instance: MetricsCollector;
  private metrics = {
    connections: 0,
    messages: 0,
    errors: 0,
    responseTime: [],
  };

  static getInstance() {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  incrementConnections() {
    this.metrics.connections++;
  }

  incrementMessages() {
    this.metrics.messages++;
  }

  addResponseTime(time: number) {
    this.metrics.responseTime.push(time);
    if (this.metrics.responseTime.length > 1000) {
      this.metrics.responseTime.shift();
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      avgResponseTime: this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length || 0,
    };
  }
}
```

## 📞 Support

For issues and questions:

- Email: thangnd111220@gmail.com
- GitHub: [@thang11122000](https://github.com/thang11122000)

---

⭐ If this project helped you, please give it a star!
