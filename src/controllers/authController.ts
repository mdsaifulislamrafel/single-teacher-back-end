import type { Request, Response } from "express"
import jwt from "jsonwebtoken"
import { ZodError } from "zod"
import User, { UserSchema } from "../models/User"
import UserSession from "../models/UserSession"
import fs from "fs"
import cloudinary from "../config/cloudinary"
import { getDeviceInfo } from "../utils/deviceInfo"

// Helper function to generate JWT token
const generateToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  })
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body

    // Validate input
    const validatedData = UserSchema.parse({ name, email, password })

    // Check if email exists
    const existingUser = await User.findOne({ email: validatedData.email })
    if (existingUser) {
      res.status(400).json({ error: "Email already in use" })
      return
    }

    let avatarData
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "user-avatars",
          width: 500,
          height: 500,
          crop: "limit",
        })

        avatarData = {
          public_id: result.public_id,
          url: result.secure_url,
        }
      } catch (uploadError) {
        res.status(500).json({ error: "Failed to upload image" })
        return
      } finally {
        fs.unlink(req.file.path, () => {})
      }
    }

    // Create user
    const user = await User.create({
      name: validatedData.name,
      email: validatedData.email,
      password: validatedData.password,
      avatar: avatarData,
    })

    // Generate token
    const token = generateToken(user._id.toString(), user.role)

    // Create a new session
    const deviceInfo = getDeviceInfo(req)
    await UserSession.create({
      userId: user._id,
      token,
      deviceInfo,
      isActive: true,
    })

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar?.url,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)

    if (error instanceof ZodError) {
      res.status(400).json({
        error: "Validation error",
        details: error.errors.map((e) => ({
          field: e.path[0],
          message: e.message,
        })),
      })
      return
    }

    const errorMessage = error instanceof Error ? error.message : "Registration failed"

    res.status(500).json({ error: errorMessage })
  }
}

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" })
      return
    }

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" })
      return
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      res.status(401).json({ error: "Invalid credentials" })
      return
    }

    // Check if user already has an active session
    const existingSession = await UserSession.findOne({
      userId: user._id,
      isActive: true,
    })

    if (existingSession) {
      // User already has an active session
      res.status(200).json({
        hasActiveSession: true,
        userId: user._id.toString(),
        message: "You are already logged in on another device",
      })
      return
    }

    // Generate token
    const token = generateToken(user._id.toString(), user.role)

    // Create a new session
    const deviceInfo = getDeviceInfo(req)
    await UserSession.create({
      userId: user._id,
      token,
      deviceInfo,
      isActive: true,
    })

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar?.url,
      },
    })
  } catch (error) {
    console.error("Error logging in user:", error)
    res.status(500).json({ error: "Failed to login" })
  }
}

// Get current user
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user.id).select("-password")

    if (!user) {
      res.status(404).json({ error: "User not found" })
      return
    }

    res.status(200).json({ user })
  } catch (error) {
    console.error("Error fetching current user:", error)
    res.status(500).json({ error: "Failed to fetch user" })
  }
}

// Logout from all devices
export const logoutAllDevices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body

    if (!userId) {
      res.status(400).json({ error: "User ID is required" })
      return
    }

    // Deactivate all sessions for this user
    await UserSession.updateMany({ userId, isActive: true }, { isActive: false })

    res.status(200).json({ success: true, message: "Logged out from all devices" })
  } catch (error) {
    console.error("Error logging out from all devices:", error)
    res.status(500).json({ error: "Failed to logout from all devices" })
  }
}

// Logout current session
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(" ")[1]

    if (!token) {
      res.status(400).json({ error: "Token is required" })
      return
    }

    // Deactivate the current session
    await UserSession.findOneAndUpdate({ token, isActive: true }, { isActive: false })

    res.status(200).json({ success: true, message: "Logged out successfully" })
  } catch (error) {
    console.error("Error logging out:", error)
    res.status(500).json({ error: "Failed to logout" })
  }
}

export  const singleDevice = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const deviceInfo = await UserSession.findOne({userId: id, isActive: true}).populate("userId", "-password");
    if (!deviceInfo) {
      res.status(404).json({ message: "Device not found" });
      return 
    }
    res.status(200).json(deviceInfo);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};