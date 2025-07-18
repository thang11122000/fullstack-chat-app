import User, { IUser } from "../models/User";
import { createError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import cloudinary from "../lib/cloudinary";
import jwt from "jsonwebtoken";

export interface CreateUserData {
  fullname: string;
  email: string;
  password: string;
  bio?: string;
}

export interface UpdateUserData {
  fullname?: string;
  email?: string;
  bio?: string;
  profilePic?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UserResponse {
  _id: string;
  fullname: string;
  email: string;
  bio?: string;
  profilePic?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserService {
  async createUser(
    userData: CreateUserData
  ): Promise<{ user: UserResponse; token: string }> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        email: userData.email.toLowerCase(),
      });

      if (existingUser) {
        throw createError("User with this email already exists", 409);
      }

      // Create new user
      const user = new User({
        fullname: userData.fullname,
        email: userData.email.toLowerCase(),
        password: userData.password,
        bio: userData.bio || "",
      });

      await user.save();

      // Generate JWT token
      const token = this.generateToken(user._id as string);

      logger.info(`New user created: ${user.email}`);

      return {
        user: this.formatUserResponse(user),
        token,
      };
    } catch (error) {
      logger.error("Error creating user:", error);
      throw error;
    }
  }

  async authenticateUser(
    loginData: LoginData
  ): Promise<{ user: UserResponse; token: string }> {
    try {
      // Find user by email
      const user = await User.findOne({ email: loginData.email.toLowerCase() });

      if (!user) {
        throw createError("Invalid credentials", 401);
      }

      // Check password
      const isPasswordValid = await user.comparePassword(loginData.password);
      if (!isPasswordValid) {
        throw createError("Invalid credentials", 401);
      }

      // Generate JWT token
      const token = this.generateToken(user._id as string);

      logger.info(`User logged in: ${user.email}`);

      return {
        user: this.formatUserResponse(user),
        token,
      };
    } catch (error) {
      logger.error("Error authenticating user:", error);
      throw error;
    }
  }

  async updateUser(
    userId: string,
    updateData: UpdateUserData
  ): Promise<UserResponse> {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw createError("User not found", 404);
      }

      // Handle profile picture upload
      if (updateData.profilePic) {
        try {
          const uploadResult = await cloudinary.uploader.upload(
            updateData.profilePic,
            {
              folder: "chat-app/profiles",
              transformation: [
                { width: 200, height: 200, crop: "fill" },
                { quality: "auto" },
              ],
            }
          );
          updateData.profilePic = uploadResult.secure_url;
        } catch (uploadError) {
          logger.error("Error uploading profile picture:", uploadError);
          throw createError("Failed to upload profile picture", 400);
        }
      }

      // Update user
      const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
      });

      if (!updatedUser) {
        throw createError("Failed to update user", 500);
      }

      logger.info(`User updated: ${updatedUser.email}`);

      return this.formatUserResponse(updatedUser);
    } catch (error) {
      logger.error("Error updating user:", error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<UserResponse> {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw createError("User not found", 404);
      }

      return this.formatUserResponse(user);
    } catch (error) {
      logger.error("Error getting user by ID:", error);
      throw error;
    }
  }

  async getUsersForSidebar(currentUserId: string): Promise<UserResponse[]> {
    try {
      const users = await User.find({
        _id: { $ne: currentUserId },
      }).select("-password");

      return users.map((user) => this.formatUserResponse(user));
    } catch (error) {
      logger.error("Error getting users for sidebar:", error);
      throw error;
    }
  }

  async updateUserOnlineStatus(
    userId: string,
    isOnline: boolean
  ): Promise<void> {
    try {
      await User.findByIdAndUpdate(userId, {
        isOnline,
        lastSeen: new Date(),
      });
    } catch (error) {
      logger.error("Error updating user online status:", error);
      throw error;
    }
  }

  private generateToken(userId: string): string {
    return jwt.sign({ userId }, process.env.JWT_SECRET ?? "", {
      expiresIn: process.env.JWT_EXPIRES_IN ?? "24h",
    } as jwt.SignOptions);
  }

  private formatUserResponse(user: IUser): UserResponse {
    return {
      _id: user._id as string,
      fullname: user.fullname,
      email: user.email,
      bio: user.bio,
      profilePic: user.profilePic,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

export const userService = new UserService();
