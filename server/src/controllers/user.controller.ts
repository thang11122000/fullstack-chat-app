import { validationResult } from "express-validator";
import { Request, Response } from "express";
import User from "@/models/User";
import jwt, { SignOptions } from "jsonwebtoken";
import cloudinary from "@/lib/cloudinary";

export const signUp = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { fullname, email, password, bio } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email or username already exists",
      });
    }

    // Create new user
    const user = new User({
      fullname,
      email,
      password,
      bio,
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    } as SignOptions);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    } as SignOptions);

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const checkAuth = async (req: Request, res: Response) => {
  return res.json({
    success: true,
    user: req.user,
  });
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { fullname, email, bio, profilePic } = req.body;

    // Validate input
    if (!fullname || !email) {
      return res.status(400).json({
        success: false,
        message: "Full name and email are required",
      });
    }

    const userId = req.user._id;
    let updatedUser;

    if (profilePic) {
      const upload = await cloudinary.uploader.upload(profilePic, {
        folder: "chat-app",
      });
      updatedUser = await User.findByIdAndUpdate(userId, {
        fullname,
        email,
        bio,
        profilePic: upload.secure_url,
      });
    } else {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { fullname, email, bio },
        { new: true }
      );
    }

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
