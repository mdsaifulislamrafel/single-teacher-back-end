import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";
import User, { UserSchema } from "../models/User";
import fs from "fs";
import cloudinary from "../config/cloudinary";


// Helper function to generate JWT token
const generateToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    const validatedData = UserSchema.parse({ name, email, password });

    // Check if email exists
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      res.status(400).json({ error: "Email already in use" });
      return;
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
        res.status(500).json({ error: "Failed to upload image" });
        return;
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
      res.status(400).json({
        error: "Validation error",
        details: error.errors.map((e) => ({
          field: e.path[0],
          message: e.message,
        })),
      });
      return;
    }

    const errorMessage =
      error instanceof Error ? error.message : "Registration failed";

    res.status(500).json({ error: errorMessage });
  }
};
// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
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
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching current user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

