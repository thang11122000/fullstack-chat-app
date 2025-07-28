import { useState, useCallback } from "react";
import { useEffect } from "react";
import type { ReactNode } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io, Socket } from "socket.io-client";
import type { AuthContextType, User, LoginCredentials } from "./auth.types";

// Extend Socket type to include our custom cleanup function
interface ExtendedSocket extends Socket {
  _bfcacheCleanup?: () => void;
}
import { AuthContext } from "./AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useBfcacheOptimization } from "../../src/utils/bfcache";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [socket, setSocket] = useState<ExtendedSocket | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // bfcache optimization
  const { registerSocketCleanup } = useBfcacheOptimization();

  const handleError = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      toast.error(
        error.response?.data?.message || error.message || "An error occurred"
      );
    } else if (error instanceof Error) {
      toast.error(error.message);
    } else {
      toast.error("An error occurred");
    }
  };

  const connectSocket = useCallback(
    (userData: User) => {
      if (!userData || socket?.connected) return;

      const newSocket = io(backendUrl, {
        auth: { token },
        // back-forward cache friendly options
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      }) as ExtendedSocket;

      newSocket.connect();
      setSocket(newSocket);

      newSocket.on("getOnlineUsers", (users: string[]) => {
        setOnlineUsers(users);
      });

      // Register cleanup for back-forward cache
      const unregisterCleanup = registerSocketCleanup(() => {
        if (newSocket?.connected) {
          console.log("Disconnecting socket for back-forward cache");
          newSocket.disconnect();
        }
      });

      // Listen for restoration
      const handleRestore = () => {
        if (newSocket && !newSocket.connected && userData) {
          console.log("Restoring socket connection after back-forward cache");
          setTimeout(() => {
            newSocket.connect();
          }, 100);
        }
      };

      window.addEventListener("bfcache-restore-connections", handleRestore);

      // Store cleanup functions
      newSocket._bfcacheCleanup = () => {
        unregisterCleanup();
        window.removeEventListener(
          "bfcache-restore-connections",
          handleRestore
        );
      };
    },
    [socket?.connected, token, registerSocketCleanup]
  );

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/auth/check");
      const { user } = data.data;
      if (user) {
        setAuthUser(user);
        connectSocket(user);
      } else {
        setAuthUser(null);
        if (location.pathname !== "/login") {
          navigate("/login", { replace: true });
        }
      }
    } catch (error) {
      setAuthUser(null);
      if (location.pathname !== "/login") {
        navigate("/login", { replace: true });
      }
      handleError(error);
    } finally {
      setIsAuthLoading(false);
    }
  }, [connectSocket, location.pathname, navigate]);

  const login = useCallback(
    async (state: string, credentials: LoginCredentials) => {
      try {
        const { data } = await axios.post(`/api/auth/${state}`, credentials);
        if (data.success) {
          const { user, token } = data.data;
          console.log(user);
          setAuthUser(user);
          connectSocket(user);
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          setToken(token);
          localStorage.setItem("token", token);
          navigate("/", { replace: true });
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        handleError(error);
      }
    },
    [connectSocket, navigate]
  );

  const logout = useCallback(async () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    axios.defaults.headers.common["Authorization"] = null;
    toast.success("Logged out successfully");

    // Clean disconnect for back-forward cache
    if (socket) {
      if (socket._bfcacheCleanup) {
        socket._bfcacheCleanup();
      }
      socket.disconnect();
    }

    navigate("/login", { replace: true });
  }, [navigate, socket]);

  const updateProfile = useCallback(
    async (body: Partial<User> & { profilePic?: string }) => {
      try {
        const { data } = await axios.put("/api/auth/profile", body);
        if (data.success) {
          const { user } = data.data;
          setAuthUser(user);
          toast.success("Profile updated successfully");
        }
      } catch (error) {
        handleError(error);
      }
    },
    []
  );

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    if (location.pathname !== "/login") {
      checkAuth();
    } else {
      setIsAuthLoading(false);
    }
    // eslint-disable-next-line
  }, []);

  const value: AuthContextType = {
    axios,
    token,
    setToken,
    authUser,
    setAuthUser,
    onlineUsers,
    setOnlineUsers,
    socket,
    setSocket,
    login,
    logout,
    updateProfile,
    isAuthLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
