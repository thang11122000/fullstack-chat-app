# 💬 Chat Application Client

Modern React-based client cho ứng dụng chat real-time với giao diện đẹp và hiệu suất cao.

## 🎨 Tech Stack

### Core Technologies

- **Framework**: React 19 với TypeScript
- **Build Tool**: Vite 7 với HMR
- **Styling**: Tailwind CSS 4
- **Routing**: React Router DOM 7
- **Real-time**: Socket.IO Client
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast

### Development Tools

- **Linting**: ESLint 9 với TypeScript support
- **Type Checking**: TypeScript 5.8
- **Bundle Analysis**: Rollup Plugin Visualizer
- **Compression**: Vite Plugin Compression

## ✨ Features

### 🔐 Authentication

- User registration và login
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

- Code splitting và lazy loading
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
# Clone và navigate
git clone <repository-url>
cd chat-app/client

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### Environment Configuration

Tạo file `.env`:

```env
# API Configuration
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000

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

Server sẽ chạy tại `http://localhost:5173`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Build Analysis

```bash
# Build với bundle analysis
npm run build:analyze

# Build với compression report
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
│   │   ├── ui/             # Basic UI components
│   │   ├── chat/           # Chat-specific components
│   │   └── auth/           # Authentication components
│   ├── pages/              # Page components
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── Chat.tsx
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
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}
```

### Chat Context

```typescript
// context/chat/ChatProvider.tsx
interface ChatContextType {
  messages: Message[];
  users: User[];
  onlineUsers: string[];
  selectedUser: User | null;
  sendMessage: (message: string, image?: File) => void;
  selectUser: (user: User) => void;
  markAsRead: (messageId: string) => void;
  typing: boolean;
  setTyping: (typing: boolean) => void;
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

### Component Styling Patterns

```tsx
// Consistent styling patterns
const Button = ({ variant = "primary", size = "md", children, ...props }) => {
  const baseClasses =
    "font-medium rounded-lg transition-colors focus:outline-none focus:ring-2";

  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary:
      "bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]}`}
      {...props}
    >
      {children}
    </button>
  );
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

  async register(userData: RegisterData) {
    const response = await api.post("/api/auth/register", userData);
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get("/api/auth/me");
    return response.data;
  },
};

// services/messageService.ts
export const messageService = {
  async getMessages(chatId: string) {
    const response = await api.get(`/api/messages/${chatId}`);
    return response.data;
  },

  async sendMessage(messageData: MessageData) {
    const response = await api.post("/api/messages", messageData);
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
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const newSocket = io(SOCKET_URL, {
        auth: { token: user.token },
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  return socket;
};
```

### useLocalStorage Hook

```typescript
// hooks/useLocalStorage.ts
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
};
```

## 🚀 Performance Optimization

### Code Splitting

```typescript
// Lazy loading pages
const Home = lazy(() => import("./pages/Home"));
const Chat = lazy(() => import("./pages/Chat"));
const Login = lazy(() => import("./pages/Login"));

// App.tsx
function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/login" element={<Login />} />
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
        <MessageItem key={message.id} message={message} />
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

### Image Optimization

```typescript
// components/OptimizedImage.tsx
interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  placeholder = "/placeholder.jpg",
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };
    img.src = src;
  }, [src]);

  return (
    <div className={`relative ${className}`}>
      <img
        src={imageSrc}
        alt={alt}
        className={`transition-opacity duration-300 ${
          isLoading ? "opacity-50" : "opacity-100"
        }`}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" />
        </div>
      )}
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
    visualizer({
      filename: "dist/stats.html",
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    target: "esnext",
    minify: "terser",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          socket: ["socket.io-client"],
          ui: ["react-hot-toast"],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/utils/*": ["./src/utils/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## 🧪 Testing

### Test Setup (Recommended)

```bash
# Install testing dependencies
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest jsdom
```

### Example Test

```typescript
// __tests__/components/Button.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "../src/components/ui/Button";

describe("Button Component", () => {
  it("renders correctly", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("handles click events", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## 🐳 Deployment

### Docker

```dockerfile
# Multi-stage build
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration

```nginx
# nginx.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Vercel Deployment

```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

## 🔍 Troubleshooting

### Common Issues

#### Build Errors

```bash
# Clear node_modules và reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

#### Socket Connection Issues

```typescript
// Debug socket connection
const socket = io(SOCKET_URL, {
  debug: true,
  transports: ["websocket", "polling"],
});

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error);
});
```

#### Performance Issues

```bash
# Analyze bundle size
npm run build:analyze

# Check for memory leaks
# Use React DevTools Profiler
```

## 📊 Bundle Analysis

### Build Output Example

```
dist/
├── assets/
│   ├── index-a1b2c3d4.js      # Main bundle (120KB)
│   ├── vendor-e5f6g7h8.js     # Vendor libs (180KB)
│   ├── router-i9j0k1l2.js     # Router chunk (25KB)
│   ├── socket-m3n4o5p6.js     # Socket.IO (45KB)
│   └── index-q7r8s9t0.css     # Styles (15KB)
├── index.html                  # Entry point
└── stats.html                  # Bundle analyzer
```

### Performance Metrics

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Bundle Size**: < 500KB (gzipped)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Follow coding standards và conventions
4. Write tests cho new features
5. Commit changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open Pull Request

### Code Style Guidelines

- Use TypeScript cho type safety
- Follow React best practices
- Use functional components với hooks
- Implement proper error boundaries
- Write meaningful commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

**Made with ❤️ using React và modern web technologies**
