import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";
import User, { UserSchema } from "../models/User";
import UserSession from "../models/UserSession";
import fs from "fs";
import cloudinary from "../config/cloudinary";
import { getDeviceInfo } from "../utils/deviceInfo";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { OAuth2Client } from 'google-auth-library';

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

    // Create a new session
    const deviceInfo = getDeviceInfo(req);
    await UserSession.create({
      userId: user._id,
      token,
      deviceInfo,
      isActive: true,
    });

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

    // Check if user already has an active session
    const existingSession = await UserSession.findOne({
      userId: user._id,
      isActive: true,
    });

    if (existingSession) {
      // User already has an active session
      res.status(200).json({
        hasActiveSession: true,
        userId: user._id.toString(),
        message: "You are already logged in on another device",
      });
      return;
    }

    // Generate token
    const token = generateToken(user._id.toString(), user.role);

    // Create a new session
    const deviceInfo = getDeviceInfo(req);
    await UserSession.create({
      userId: user._id,
      token,
      deviceInfo,
      isActive: true,
    });

    res.status(200).json({
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
    console.error("Error logging in user:", error);
    res.status(500).json({ error: "Failed to login" });
  }
};

// Get current user
export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<void> => {
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

// Logout from all devices
export const logoutAllDevices = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    // Deactivate all sessions for this user
    await UserSession.updateMany(
      { userId, isActive: true },
      { isActive: false }
    );

    res
      .status(200)
      .json({ success: true, message: "Logged out from all devices" });
  } catch (error) {
    console.error("Error logging out from all devices:", error);
    res.status(500).json({ error: "Failed to logout from all devices" });
  }
};

// Logout current session
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(400).json({ error: "Token is required" });
      return;
    }

    // Deactivate the current session
    await UserSession.findOneAndUpdate(
      { token, isActive: true },
      { isActive: false }
    );

    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).json({ error: "Failed to logout" });
  }
};

export const singleDevice = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    const deviceInfo = await UserSession.findOne({
      userId: id,
      isActive: true,
    }).populate("userId", "-password");
    if (!deviceInfo) {
      res.status(404).json({ message: "Device not found" });
      return;
    }
    res.status(200).json(deviceInfo);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Configure transporter with environment variables

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || "mdsaifulisalmrafel@gmail.com",
    pass: process.env.EMAIL_PASSWORD || "crpu mgvt csru brep",
  },
});

// Forgot password - generate reset token and send email
export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      // For security reasons, don't reveal whether the email exists
      res.status(200).json({
        success: true,
        message:
          "If this email is registered, a password reset link will be sent",
      });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash the token before storing it (more secure)
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = resetPasswordExpire;
    await user.save();

    // Create reset URL - send the unhashed token to the user
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Email options
    const mailOptions = {
      from: `"${process.env.APP_NAME || "Your App"}" <${
        process.env.EMAIL_USER
      }>`,
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${user.name},</p>
          <p>You recently requested to reset your password. Click the link below to reset it:</p>
          <p style="margin: 20px 0;">
            <a href="${resetUrl}" style="background-color: #4A90E2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a>
          </p>
          <p>Or copy and paste this URL into your browser:</p>
          <p style="word-break: break-all; color: #4A90E2;">
            ${resetUrl}
          </p>
          <p>This link will expire in 30 minutes.</p>
          <p>If you didn't request this, please ignore this email or contact support if you have concerns.</p>
          <p style="margin-top: 20px; font-size: 12px; color: #999;">This is an automated email, please do not reply.</p>
        </div>
      `,
      // প্লেইন টেক্সট বিকল্প যোগ করুন কিছু ইমেইল ক্লায়েন্টের জন্য
      text: `
        Hello ${user.name},
        
        You recently requested to reset your password. Please copy and paste the link below to reset your password:
        
        ${resetUrl}
        
        This link will expire in 30 minutes.
        
        If you didn't request this, please ignore this email or contact support if you have concerns.
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message:
        "If this email is registered, a password reset link will be sent",
    });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res.status(500).json({ error: "Failed to process password reset request" });
  }
};

// Reset password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      res.status(400).json({ error: "Token is required" });
      return;
    }

    if (!password) {
      res.status(400).json({ error: "Password is required" });
      return;
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ error: "Invalid or expired token" });
      return;
    }

    // Set new password and remove reset fields safely
    user.password = password;

    // Option 1: Using set (safe for strict types)
    user.set("resetPasswordToken", undefined, { strict: false });
    user.set("resetPasswordExpire", undefined, { strict: false });

    // Option 2: Or delete (if strict is relaxed)
    // delete user.resetPasswordToken;
    // delete user.resetPasswordExpire;

    await user.save();

    // Invalidate active sessions
    await UserSession.updateMany(
      { userId: user._id, isActive: true },
      { isActive: false }
    );

    res.status(200).json({
      success: true,
      message: "Password reset successful. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
};

export const validateResetToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    
    if (!token) {
      res.status(400).json({ valid: false, error: "Token is required" });
      return;
    }

    // Hash the token to match what we stored in the database
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    
    // Find user with the hashed token that hasn't expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
    
    res.status(200).json({ valid: !!user });
  } catch (error) {
    console.error("Error in validateResetToken:", error);
    res.status(500).json({ valid: false, error: "Token validation failed" });
  }
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userData } = req.body; // Changed from token to userData
     
    if (!userData || !userData.email) {
      res.status(400).json({ error: "Google user data is required" });
      return;
    }
     
    // Extract user data from the provided userData object
    const { email, name, picture } = userData;
     
    // Check if user exists
    let user = await User.findOne({ email });
     
    if (!user) {
      // Create new user if doesn't exist
      user = await User.create({
        name,
        email,
        password: crypto.randomBytes(16).toString('hex'), // Random password
        avatar: {
          url: picture,
        },
        isVerified: true,
      });
    }
     
    // Check if user already has an active session
    const existingSession = await UserSession.findOne({
      userId: user._id,
      isActive: true,
    });
     
    if (existingSession) {
      // User already has an active session
      res.status(200).json({
        hasActiveSession: true,
        userId: user._id.toString(),
        message: "You are already logged in on another device",
      });
      return;
    }
     
    // Generate JWT token
    const jwtToken = generateToken(user._id.toString(), user.role);
     
    // Create a new session
    const deviceInfo = getDeviceInfo(req);
    await UserSession.create({
      userId: user._id,
      token: jwtToken,
      deviceInfo,
      isActive: true,
    });
     
    res.status(200).json({
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar?.url,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ error: "Failed to authenticate with Google" });
  }
};