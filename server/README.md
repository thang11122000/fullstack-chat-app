# 🚀 Chat Application Server

High-performance Node.js server cho ứng dụng chat real-time với khả năng xử lý hàng nghìn người dùng đồng thời.

## 🏗️ Kiến trúc

### Tech Stack

- **Runtime**: Node.js 16+ với TypeScript
- **Framework**: Express.js với Socket.IO
- **Database**: MongoDB với Mongoose ODM
- **Cache**: Redis với connection pooling
- **Authentication**: JWT với bcrypt
- **File Upload**: Cloudinary integration
- **Logging**: Winston với structured logging
- **Process Management**: Node.js Cluster

### Tính năng chính

#### 🔌 Real-time Communication

- Socket.IO với WebSocket và polling fallback
- Redis adapter cho horizontal scaling
- Connection pooling và rate limiting
- Debounced typing indicators
- Optimized event handling

#### 🗄️ Database Optimization

- MongoDB connection pooling (50 connections)
- Compound indexes cho performance
- Bulk operations và lean queries
- Query monitoring và slow query detection
- Automatic retry với exponential backoff

#### ⚡ Performance Features

- Node.js clustering với load balancing
- Redis caching với TTL
- Message queue với batch processing
- Compression middleware
- Rate limiting và security headers

#### 📊 Monitoring & Analytics

- Real-time performance metrics
- Health check endpoints
- CPU, Memory, Database monitoring
- Alert system với configurable thresholds
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
# Clone và navigate
git clone <repository-url>
cd chat-app/server

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### Environment Configuration

Tạo file `.env`:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb://localhost:27017/chat-app

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

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
│   ├── middleware/           # Express middleware
│   ├── models/              # MongoDB models
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   ├── socket/              # Socket.IO handlers
│   ├── utils/               # Utility functions
│   ├── lib/                 # External integrations
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
POST /api/auth/register    # User registration
POST /api/auth/login       # User login
POST /api/auth/logout      # User logout
GET  /api/auth/me          # Get current user
```

### Message Endpoints

```
GET  /api/messages/:chatId      # Get messages for chat
POST /api/messages              # Send new message
PUT  /api/messages/:id/read     # Mark message as read
```

### User Endpoints

```
GET  /api/users                 # Get all users
GET  /api/users/:id             # Get user by ID
PUT  /api/users/:id             # Update user profile
```

### Health & Monitoring

```
GET  /api/health               # System health check
GET  /api/metrics              # Performance metrics
GET  /api/queue/stats          # Message queue statistics
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
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  profilePic: String (optional),
  isOnline: Boolean,
  lastSeen: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Message Model

```javascript
{
  _id: ObjectId,
  senderId: ObjectId (ref: User),
  receiverId: ObjectId (ref: User),
  text: String (optional),
  image: String (optional),
  seen: Boolean,
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

// Partial indexes
messageSchema.index(
  { seen: 1, createdAt: -1 },
  { partialFilterExpression: { seen: false } }
);

// Text search index
messageSchema.index({ text: "text" }, { weights: { text: 10 } });
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

## 🐳 Deployment

### Docker

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
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start application
CMD ["npm", "start"]
```

### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "chat-server",
      script: "dist/index.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
    },
  ],
};
```

## 🔍 Troubleshooting

### Common Issues

#### High Memory Usage

```bash
# Check memory usage
node --inspect dist/index.js

# Enable garbage collection logging
node --trace-gc dist/index.js
```

#### Database Connection Issues

```bash
# Check MongoDB connection
mongosh mongodb://localhost:27017/chat-app

# Monitor slow queries
db.setProfilingLevel(2, { slowms: 100 })
```

#### Redis Connection Problems

```bash
# Test Redis connection
redis-cli ping

# Monitor Redis
redis-cli monitor
```

### Performance Tuning

#### Increase Batch Processing

```javascript
// config/performance.js
export const PERFORMANCE_CONFIG = {
  BATCH_SIZE: 100, // Default: 50
  PROCESSING_INTERVAL: 50, // Default: 100ms
  MAX_CONNECTIONS: 100, // Default: 50
  REDIS_POOL_SIZE: 20, // Default: 10
};
```

#### Database Optimization

```javascript
// Enable query logging
mongoose.set("debug", true);

// Use lean queries for read operations
const messages = await Message.find(query).lean();

// Use select to limit fields
const users = await User.find().select("username email profilePic");
```

## 📝 Logging

### Log Levels

- `error`: System errors và exceptions
- `warn`: Warning messages
- `info`: General information
- `debug`: Debug information (development only)

### Log Format

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "info",
  "message": "User connected",
  "userId": "user123",
  "socketId": "socket456",
  "ip": "192.168.1.1"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

**Made with ❤️ for high-performance real-time applications**
