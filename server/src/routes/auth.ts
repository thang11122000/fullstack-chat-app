import express from "express";
import { body } from "express-validator";
import { authMiddleware } from "../middleware/auth";
import {
  checkAuth,
  login,
  signUp,
  updateProfile,
  logout,
} from "../controllers/user.controller";

const router = express.Router();

// Register new user
router.post(
  "/signup",
  [
    body("fullname")
      .trim()
      .notEmpty()
      .withMessage("Full name is required")
      .isLength({ min: 2, max: 50 })
      .withMessage("Full name must be between 2 and 50 characters"),
    body("email")
      .isEmail()
      .withMessage("Please provide a valid email")
      .normalizeEmail(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("bio")
      .optional()
      .isLength({ max: 200 })
      .withMessage("Bio must be less than 200 characters"),
  ],
  signUp
);

// Login user
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Please provide a valid email")
      .normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  login
);

// Check authentication
router.get("/check", authMiddleware, checkAuth);

// Update profile
router.put(
  "/profile",
  authMiddleware,
  [body("fullname").trim().notEmpty().withMessage("Full name is required")],
  updateProfile
);

// Logout user
router.post("/logout", authMiddleware, logout);

export default router;
