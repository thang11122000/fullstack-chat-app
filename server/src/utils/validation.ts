import { body } from "express-validator";

export const registerValidation = [
  body("username")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers and underscores"),
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

export const loginValidation = [
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

export const updateProfileValidation = [
  body("username")
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers and underscores"),
  body("avatar").optional().isURL().withMessage("Avatar must be a valid URL"),
];

export const createChatValidation = [
  body("participantId")
    .notEmpty()
    .withMessage("Participant ID is required")
    .isMongoId()
    .withMessage("Invalid participant ID"),
];

export const markAsReadValidation = [
  body("messageIds")
    .isArray({ min: 1 })
    .withMessage("Message IDs must be a non-empty array")
    .custom((value) => {
      return value.every((id: string) => /^[0-9a-fA-F]{24}$/.test(id));
    })
    .withMessage("All message IDs must be valid MongoDB ObjectIds"),
];
