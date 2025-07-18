import { validationResult } from "express-validator";
import { Request, Response } from "express";
import { userService } from "../services/userService";
import { ResponseHelper } from "../utils/response";
import { asyncHandler } from "../middleware/errorHandler";

export const signUp = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ResponseHelper.validationError(res, errors.array());
  }

  const { fullname, email, password, bio } = req.body;

  const result = await userService.createUser({
    fullname,
    email,
    password,
    bio,
  });

  return ResponseHelper.created(
    res,
    {
      token: result.token,
      user: result.user,
    },
    "User registered successfully"
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ResponseHelper.validationError(res, errors.array());
  }

  const { email, password } = req.body;

  const result = await userService.authenticateUser({ email, password });

  return ResponseHelper.success(
    res,
    {
      token: result.token,
      user: result.user,
    },
    "Login successful"
  );
});

export const checkAuth = asyncHandler(async (req: Request, res: Response) => {
  return ResponseHelper.success(
    res,
    { user: req.user },
    "Authentication successful"
  );
});

export const updateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const { fullname, bio, profilePic } = req.body;

    const updatedUser = await userService.updateUser(req.user._id, {
      fullname,
      bio,
      profilePic,
    });

    return ResponseHelper.success(
      res,
      { user: updatedUser },
      "Profile updated successfully"
    );
  }
);

export const getUsersForSidebar = asyncHandler(
  async (req: Request, res: Response) => {
    const users = await userService.getUsersForSidebar(req.user._id);
    return ResponseHelper.success(
      res,
      { users },
      "Users retrieved successfully"
    );
  }
);

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await userService.updateUserOnlineStatus(req.user._id, false);
  return ResponseHelper.success(res, null, "Logout successful");
});
