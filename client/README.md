# 💬 Chat Application - Frontend

Modern React-based client for the real-time chat application with beautiful UI and high performance.

## 🎨 Technology Stack

### Core Technologies

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7 with HMR
- **Styling**: Tailwind CSS 4
- **Routing**: React Router DOM 7
- **Real-time**: Socket.IO Client
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast

### Development Tools

- **Linting**: ESLint 9 with TypeScript support
- **Type Checking**: TypeScript 5.8
- **Bundle Analysis**: Rollup Plugin Visualizer
- **Compression**: Vite Plugin Compression

## ✨ Features

### 🔐 Authentication

- User registration and login
- JWT token management
- Protected routes
- Persistent authentication state

### 💬 Real-time Messaging

- Instant message delivery
- Typing indicators
- Message read receipts
- Online/offline status
- Image sharing support

### 🎨 User Interface

- Modern, responsive design
- Dark/Light theme support
- Mobile-first approach
- Smooth animations
- Optimized performance

### 🚀 Performance Optimizations

- Code splitting and lazy loading
- Bundle compression (Gzip/Brotli)
- Image optimization
- Efficient re-rendering
- Memory leak prevention

## 🛠️ Installation

### Prerequisites

```bash
Node.js >= 16.0.0
npm >= 8.0.0
```

### Setup

```bash
# Clone and navigate
git clone <repository-url>
cd chat-app/client

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### Environment Configuration

Create `.env` file:

```env
# API Configuration
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000

# App Configuration
VITE_APP_NAME=Chat App
VITE_APP_VERSION=1.0.0

# Development
VITE_DEV_MODE=true
VITE_DEBUG=false
```

## 🚀 Running the Client

### Development Mode

```bash
npm run dev
```

Server will run at `http://localhost:5173`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Build Analysis

```bash
# Build with bundle analysis
npm run build:analyze

# Build with compression report
npm run build:report
```

### Other Commands

```bash
# Linting
npm run lint

# Type checking
npx tsc --noEmit
```

## 📁 Project Structure

```
client/
├── public/                  # Static assets
│   ├── favicon.svg
│   ├── bgImage.svg
│   └── vite.svg
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ChatContainer.tsx
│   │   ├── Sidebar.tsx
│   │   └── RightSidebar.tsx
│   ├── pages/              # Page components
│   │   ├── Homepage.tsx
│   │   ├── LoginPage.tsx
│   │   └── Profile.tsx
│   ├── context/            # React Context providers
│   │   ├── auth/           # Authentication context
│   │   └── chat/           # Chat context
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # External service integrations
│   ├── utils/              # Utility functions
│   ├── assets/             # Images, icons, etc.
│   ├── App.tsx             # Main App component
│   ├── main.tsx            # Application entry point
│   ├── index.css           # Global styles
│   └── vite-env.d.ts       # Vite type definitions
├── context/                # Shared context (legacy)
├── dist/                   # Production build output
├── scripts/                # Build scripts
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## 🎯 Core Components

### Authentication Context

```typescript
// context/auth/AuthProvider.tsx
interface AuthContextType {
  authUser: User | null;
  isAuthLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
}
```

### Socket Integration

```typescript
// lib/socket.ts
import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });
  }

  disconnect() {
    this.socket?.disconnect();
  }

  // Event handlers
  onMessageReceived(callback: (message: Message) => void) {
    this.socket?.on("message_received", callback);
  }

  sendMessage(message: MessageData) {
    this.socket?.emit("send_message", message);
  }
}
```

## 🎨 Styling Guide

### Tailwind CSS Configuration

```javascript
// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        gray: {
          50: "#f9fafb",
          100: "#f3f4f6",
          900: "#111827",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
```

## 🔌 API Integration

### HTTP Client Setup

```typescript
// lib/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

### API Service Functions

```typescript
// services/authService.ts
export const authService = {
  async login(credentials: LoginCredentials) {
    const response = await api.post("/api/auth/login", credentials);
    return response.data;
  },

  async signup(userData: SignupData) {
    const response = await api.post("/api/auth/signup", userData);
    return response.data;
  },

  async checkAuth() {
    const response = await api.get("/api/auth/check");
    return response.data;
  },
};

// services/messageService.ts
export const messageService = {
  async getUsers() {
    const response = await api.get("/api/messages/users");
    return response.data;
  },

  async getMessages(userId: string) {
    const response = await api.get(`/api/messages/conversation/${userId}`);
    return response.data;
  },

  async sendMessage(userId: string, messageData: MessageData) {
    const response = await api.post(
      `/api/messages/send/${userId}`,
      messageData
    );
    return response.data;
  },
};
```

## 🎣 Custom Hooks

### useAuth Hook

```typescript
// hooks/useAuth.ts
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
```

### useSocket Hook

```typescript
// hooks/useSocket.ts
export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { authUser } = useAuth();

  useEffect(() => {
    if (authUser) {
      const token = localStorage.getItem("token");
      const newSocket = io(SOCKET_URL, {
        auth: { token },
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [authUser]);

  return socket;
};
```

## 🚀 Performance Optimization

### Code Splitting

```typescript
// Lazy loading pages
const Homepage = lazy(() => import("./pages/Homepage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const Profile = lazy(() => import("./pages/Profile"));

// App.tsx
function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Suspense>
  );
}
```

### Memoization

```typescript
// Memoized components
const MessageList = memo(({ messages }: { messages: Message[] }) => {
  return (
    <div className="space-y-2">
      {messages.map((message) => (
        <MessageItem key={message._id} message={message} />
      ))}
    </div>
  );
});

// Memoized values
const ChatComponent = () => {
  const { messages, users } = useChat();

  const sortedMessages = useMemo(
    () =>
      messages.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    [messages]
  );

  const onlineUserCount = useMemo(
    () => users.filter((user) => user.isOnline).length,
    [users]
  );

  return (
    <div>
      <MessageList messages={sortedMessages} />
      <div>Online: {onlineUserCount}</div>
    </div>
  );
};
```

## 🔧 Build Configuration

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { compression } from "vite-plugin-compression";

export default defineConfig({
  plugins: [
    react(),
    compression({
      algorithm: "gzip",
      ext: ".gz",
    }),
    compression({
      algorithm: "brotliCompress",
      ext: ".br",
    }),
    process.env.ANALYZE &&
      visualizer({
        filename: "dist/stats.html",
        open: true,
      }),
  ].filter(Boolean),
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          socket: ["socket.io-client"],
        },
      },
    },
  },
});
```

## 📱 Responsive Design

### Breakpoints

```css
/* Mobile First Approach */
.container {
  @apply px-4 mx-auto;
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    @apply px-6;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    @apply px-8 max-w-7xl;
  }
}
```

### Component Responsiveness

```tsx
const ChatLayout = () => {
  return (
    <div className="flex h-screen">
      {/* Sidebar - Hidden on mobile, visible on tablet+ */}
      <div className="hidden md:flex md:w-1/4 lg:w-1/5">
        <Sidebar />
      </div>

      {/* Main Chat - Full width on mobile */}
      <div className="flex-1 flex flex-col">
        <ChatContainer />
      </div>

      {/* Right Sidebar - Hidden on mobile/tablet, visible on desktop */}
      <div className="hidden lg:flex lg:w-1/5">
        <RightSidebar />
      </div>
    </div>
  );
};
```

## 🧪 Testing

### Unit Tests

```typescript
// __tests__/components/MessageItem.test.tsx
import { render, screen } from "@testing-library/react";
import MessageItem from "../MessageItem";

describe("MessageItem", () => {
  const mockMessage = {
    _id: "1",
    text: "Hello World",
    senderId: { _id: "user1", fullname: "John Doe" },
    createdAt: new Date().toISOString(),
  };

  it("renders message text", () => {
    render(<MessageItem message={mockMessage} />);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("displays sender name", () => {
    render(<MessageItem message={mockMessage} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });
});
```

## 🚀 Deployment

### Build for Production

```bash
# Install dependencies
npm ci

# Build the application
npm run build

# The dist/ folder contains the production build
```

### Environment Variables for Production

```env
VITE_API_URL=https://your-api-domain.com
VITE_SOCKET_URL=https://your-api-domain.com
VITE_APP_NAME=Chat App
VITE_APP_VERSION=1.0.0
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/chat-app/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📞 Support

For issues and questions:

- Email: thangnd111220@gmail.com
- GitHub: [@thang11122000](https://github.com/thang11122000)

---

⭐ If this project helped you, please give it a star!
