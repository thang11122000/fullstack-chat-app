# 💬 Chat Application

High-performance real-time chat application built with React 19, Node.js, Socket.IO, and MongoDB.

## 🌐 Live Demo

🚀 **[Try the live demo here](https://frontend-chat-app-lilac.vercel.app/login)**

## ✨ Key Features

### 🔐 Authentication & Security

- **Sign up/Sign in**: JWT-based authentication system
- **Password security**: bcrypt encryption with salt
- **Token authentication**: Middleware protection for API routes
- **Rate limiting**: Request throttling to prevent spam
- **Validation**: Input validation with express-validator

### 💬 Real-time Messaging

- **Send/receive messages**: Text and image messages
- **Socket.IO**: Real-time connection with WebSocket fallback
- **Read status**: Mark messages as seen
- **Typing indicators**: Show when users are typing
- **Message queue**: Batch processing for performance optimization
- **Offline support**: Store messages when recipient is offline

### 👥 User Management

- **Profile management**: Update personal information
- **Online status**: Display online/offline status
- **User search**: Find users to start conversations
- **Last seen**: Last activity timestamp

### 🎨 User Interface

- **Responsive design**: Compatible with all devices
- **Dark/Light mode**: Theme switching
- **Modern UI**: Contemporary design with Tailwind CSS
- **Toast notifications**: Real-time notifications
- **Loading states**: Smooth loading experiences

### ⚡ Performance Optimization

- **Redis caching**: Cache user data and sessions
- **Database indexing**: Optimized MongoDB queries
- **Connection pooling**: Efficient Socket.IO connection management
- **Batch processing**: Message processing in batches
- **Compression**: Static file compression

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │   Node.js API   │    │    MongoDB      │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (Database)    │
│                 │    │                 │    │                 │
│  - React 19     │    │  - Express.js   │    │  - Users        │
│  - TypeScript   │    │  - Socket.IO    │    │  - Messages     │
│  - Tailwind CSS │    │  - JWT Auth     │    │  - Chats        │
│  - Vite         │    │  - TypeScript   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │              ┌─────────────────┐
         │              │      Redis      │
         └──────────────►│    (Cache)      │
                        │                 │
                        │  - Sessions     │
                        │  - User Cache   │
                        │  - Pub/Sub      │
                        └─────────────────┘
```

## 🛠️ Technology Stack

### Frontend

- **React 19** - UI framework with concurrent features
- **TypeScript** - Type safety
- **Vite** - Fast build tool with HMR
- **Tailwind CSS 4** - Utility-first CSS framework
- **Socket.IO Client** - Real-time communication
- **React Router DOM 7** - Client-side routing
- **Axios** - HTTP client
- **React Hot Toast** - Toast notifications

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Socket.IO** - Real-time bidirectional communication
- **TypeScript** - Type-safe development
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **Redis** - In-memory caching
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Winston** - Logging
- **Cloudinary** - Image upload service

## 📁 Project Structure

```
chat-app/
├── client/                     # Frontend React application
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── pages/             # Page components
│   │   ├── context/           # React Context providers
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # External integrations
│   │   ├── utils/             # Utility functions
│   │   └── assets/            # Images, icons
│   └── package.json
│
├── server/                     # Backend Node.js application
│   ├── src/
│   │   ├── controllers/        # Route controllers
│   │   ├── middleware/         # Express middleware
│   │   ├── models/            # MongoDB models
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── socket/            # Socket.IO handlers
│   │   ├── utils/             # Utility functions
│   │   └── lib/               # External integrations
│   ├── dist/                  # Compiled JavaScript
│   ├── logs/                  # Application logs
│   └── package.json
│
└── README.md                   # Project documentation
```

## 🚀 Installation & Setup

### System Requirements

- Node.js 16+
- MongoDB
- Redis
- npm or yarn

### 1. Clone repository

```bash
git clone <repository-url>
cd chat-app
```

### 2. Install dependencies

#### Backend

```bash
cd server
npm install
```

#### Frontend

```bash
cd client
npm install
```

### 3. Configure environment variables

#### Server (.env)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chatapp
JWT_SECRET=your-jwt-secret
REDIS_URL=redis://localhost:6379
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NODE_ENV=development
```

#### Client (.env)

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### 4. Run the application

#### Development mode

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

#### Production build

```bash
# Build backend
cd server
npm run build
npm start

# Build frontend
cd client
npm run build
npm run preview
```

## 📊 API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new account
- `POST /api/auth/login` - User login
- `GET /api/auth/check` - Check authentication status
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - User logout

### Messages

- `GET /api/messages/users` - Get users list for sidebar
- `GET /api/messages/conversation/:id` - Get conversation messages
- `POST /api/messages/send/:id` - Send message
- `PUT /api/messages/mark-seen/:id` - Mark message as read
- `DELETE /api/messages/:id` - Delete message
- `GET /api/messages/unread-count` - Get unread messages count

### Chat

- `GET /api/chat` - Get user's chat list
- `GET /api/chat/:chatId/messages` - Get messages in chat
- `POST /api/chat/create` - Create new chat
- `GET /api/chat/users/search` - Search users
- `PUT /api/chat/:chatId/read` - Mark messages as read

## 🔌 Socket Events

### Client → Server

- `join_chat` - Join chat room
- `leave_chat` - Leave chat room
- `send_message` - Send message
- `mark_as_read` - Mark messages as read
- `typing_start` - Start typing
- `typing_stop` - Stop typing

### Server → Client

- `getOnlineUsers` - Online users list
- `message_received` - New message received
- `message_sent` - Message sent confirmation
- `messages_read` - Messages read receipt
- `user_typing` - User typing indicator
- `message_queued` - Message queued for processing

## 🔧 Advanced Features

### Performance Optimization

- **Message Batching**: Process messages in batches to reduce database load
- **Connection Pooling**: Efficient Socket.IO connection management
- **Redis Caching**: Cache user data and sessions
- **Database Indexing**: Optimized queries with compound indexes
- **Rate Limiting**: Request throttling to prevent abuse

### Scalability

- **Redis Pub/Sub**: Support for multiple server instances
- **Horizontal Scaling**: Can scale with load balancer
- **Microservices Ready**: Architecture ready for microservices

### Security

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt
- **Input Validation**: Comprehensive validation
- **CORS Protection**: Configured CORS policies
- **Helmet.js**: Security headers

## 📈 Monitoring & Logging

- **Winston Logger**: Structured logging
- **Error Handling**: Comprehensive error handling
- **Performance Metrics**: Connection and message metrics
- **Health Checks**: API health endpoints

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Create Pull Request

## 📝 License

This project is distributed under the MIT License. See `LICENSE` file for more information.

## 📞 Contact

- Email: thangnd111220@gmail.com
- GitHub: [@thang11122000](https://github.com/thang11122000)

---

⭐ If this project helped you, please give it a star!
