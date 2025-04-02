import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";
import User, { UserSchema } from "../models/User";

import { uploadSingle } from "../middleware/upload";
import fs from "fs";
import path from "path";
import cloudinary from "../config/cloudinary";


// Helper function to generate JWT token
const generateToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    const validatedData = UserSchema.parse({ name, email, password });

    // Check if email exists
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    let avatarData;
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "user-avatars",
          width: 500,
          height: 500,
          crop: "limit",
        });

        avatarData = {
          public_id: result.public_id,
          url: result.secure_url,
        };
      } catch (uploadError) {
        return res.status(500).json({ error: "Failed to upload image" });
      } finally {
        fs.unlink(req.file.path, () => {});
      }
    }

    // Create user
    const user = await User.create({
      name: validatedData.name,
      email: validatedData.email,
      password: validatedData.password,
      avatar: avatarData,
    });

    // Generate token
    const token = generateToken(user._id.toString(), user.role);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar?.url,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error instanceof ZodError) {
      return res.status(400).json({
        error: "Validation error",
        details: error.errors.map((e) => ({
          field: e.path[0],
          message: e.message,
        })),
      });
    }

    const errorMessage =
      error instanceof Error ? error.message : "Registration failed";
    res.status(500).json({ error: errorMessage });
  }
};
// Login user
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(user._id.toString(), user.role);

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ error: "Failed to login" });
  }
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    // User is attached to request by auth middleware
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching current user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};
// Google OAuth login/register
export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { name, email, googleId } = req.body;

    if (!name || !email || !googleId) {
      return res.status(400).json({
        error: "Name, email, and Google ID are required",
      });
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user
      user = await User.create({
        name,
        email,
        googleId,
        password:
          Math.random().toString(36).slice(-10) +
          Math.random().toString(36).slice(-10), // Random password
      });
    } else if (!user.googleId) {
      // Update Google ID if not set
      user.googleId = googleId;
      await user.save();
    }

    // Generate token
    const token = generateToken(user._id.toString(), user.role);

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error with Google authentication:", error);
    res.status(500).json({ error: "Failed to authenticate with Google" });
  }
};
