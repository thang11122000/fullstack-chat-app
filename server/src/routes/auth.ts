import express from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { body, check, validationResult } from "express-validator";
import User from "../models/User";
import { authMiddleware } from "../middleware/auth";
import { Request, Response } from "express";
import {
  checkAuth,
  login,
  signUp,
  updateProfile,
} from "@/controllers/user.controller";

const router = express.Router();

// Register new user
router.post(
  "/signup",
  [
    body("fullname").notEmpty().withMessage("Full name is required"),
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  signUp
);

// Login user
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  login
);

router.put("update-profile", authMiddleware, updateProfile);
router.put("check", authMiddleware, checkAuth);

// // Logout user
// router.post("/logout", authMiddleware, async (req: Request, res: Response) => {
//   try {
//     const user = await User.findById(req.userId);
//     if (user) {
//       user.isOnline = false;
//       user.lastSeen = new Date();
//       await user.save();
//     }

//     res.json({
//       success: true,
//       message: "Logout successful",
//     });
//   } catch (error) {
//     console.error("Logout error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// });

// // Get current user profile
// router.get("/profile", authMiddleware, async (req: Request, res: Response) => {
//   try {
//     const user = await User.findById(req.userId);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     return res.json({
//       success: true,
//       user: {
//         id: user._id,
//         username: user.username,
//         email: user.email,
//         avatar: user.avatar,
//         isOnline: user.isOnline,
//         lastSeen: user.lastSeen,
//       },
//     });
//   } catch (error) {
//     console.error("Profile error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// });

// // Update user profile
// router.put(
//   "/profile",
//   authMiddleware,
//   [
//     body("username")
//       .optional()
//       .isLength({ min: 3, max: 30 })
//       .withMessage("Username must be between 3 and 30 characters")
//       .matches(/^[a-zA-Z0-9_]+$/)
//       .withMessage(
//         "Username can only contain letters, numbers and underscores"
//       ),
//     body("avatar").optional().isURL().withMessage("Avatar must be a valid URL"),
//   ],
//   async (req: Request, res: Response) => {
//     try {
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return res.status(400).json({
//           success: false,
//           message: "Validation failed",
//           errors: errors.array(),
//         });
//       }

//       const { username, avatar } = req.body;
//       const user = await User.findById(req.userId);

//       if (!user) {
//         return res.status(404).json({
//           success: false,
//           message: "User not found",
//         });
//       }

//       // Check if username is taken by another user
//       if (username && username !== user.username) {
//         const existingUser = await User.findOne({ username });
//         if (existingUser) {
//           return res.status(409).json({
//             success: false,
//             message: "Username already taken",
//           });
//         }
//         user.username = username;
//       }

//       if (avatar !== undefined) {
//         user.avatar = avatar;
//       }

//       await user.save();

//       return res.json({
//         success: true,
//         message: "Profile updated successfully",
//         user: {
//           id: user._id,
//           username: user.username,
//           email: user.email,
//           avatar: user.avatar,
//           isOnline: user.isOnline,
//         },
//       });
//     } catch (error) {
//       console.error("Profile update error:", error);
//       return res.status(500).json({
//         success: false,
//         message: "Internal server error",
//       });
//     }
//   }
// );

export default router;
