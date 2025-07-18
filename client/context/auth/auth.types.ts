export interface User {
  _id: string;
  fullname: string;
  email: string;
  profilePic?: string;
  bio?: string;
}

export interface LoginCredentials {
  fullname?: string;
  email: string;
  password: string;
  bio?: string;
}

import type { Socket } from "socket.io-client";
import type { AxiosInstance } from "axios";

export interface AuthContextType {
  axios: AxiosInstance;
  token: string | null;
  setToken: (token: string | null) => void;
  authUser: User | null;
  setAuthUser: (user: User | null) => void;
  onlineUsers: string[];
  setOnlineUsers: (users: string[]) => void;
  socket: Socket | null;
  setSocket: (socket: Socket | null) => void;
  login: (state: string, credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (
    body: Partial<User> & { profilePic?: string }
  ) => Promise<void>;
  isAuthLoading: boolean;
}
