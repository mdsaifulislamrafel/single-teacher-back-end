import type { Request, Response } from "express";
import User from "../models/User";
import Payment from "../models/Payment";
import UserProgress from "../models/UserProgress";
import cloudinary from "../config/cloudinary";

// Get all users
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// Get a single user by ID
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

// Update a user
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id

    // Find the user first
    const user = await User.findById(userId)
    if (!user) {
      res.status(404).json({ error: "User not found" })
      return
    }

    // Update name if provided
    if (req.body.name) {
      user.name = req.body.name
    }

    // Handle password change if both passwords are provided
    if (req.body.currentPassword && req.body.newPassword) {
      const isMatch = await user.comparePassword(req.body.currentPassword)
      if (!isMatch) {
        res.status(400).json({ error: "Current password is incorrect" })
        return
      }
      user.password = req.body.newPassword // This will trigger the pre-save hook
    }

    // Handle profile picture upload
    if (req.file) {
      try {

        // Delete previous avatar from cloudinary if exists
        if (user.avatar && user.avatar.public_id) {
          await cloudinary.uploader.destroy(user.avatar.public_id)
        }

        // Set new avatar
        user.avatar = {
          public_id: req.file.filename,
          url: req.file.path,
        }
      } catch (cloudinaryError) {
        console.error("Cloudinary error:", cloudinaryError)
        // Continue with user update even if cloudinary fails
      }
    }

    // Save the user
    const updatedUser = await user.save()
    console.log("User updated successfully")

    // Return the user without password
    const userWithoutPassword = updatedUser.toObject()

    res.status(200).json(userWithoutPassword)
  } catch (error: any) {
    console.error("Error updating user:", error)
    res.status(500).json({
      error: error.message || "Failed to update user",
    })
  }
}



// Delete a user
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    await Payment.deleteMany({ user: req.params.id });
    await UserProgress.deleteMany({ user: req.params.id });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

// Get user courses
export const getUserCourses = async (req: Request, res: Response) => {
  try {
    const userProgress = await UserProgress.find({ user: req.params.id })
      .populate({ path: "subcategory", select: "name category", populate: { path: "category", select: "name" } })
      .populate("lastAccessedVideo", "title")
      .sort({ updatedAt: -1 });
    res.status(200).json(userProgress);
  } catch (error) {
    console.error("Error fetching user courses:", error);
    res.status(500).json({ error: "Failed to fetch user courses" });
  }
};

// Get user PDFs
export const getUserPDFs = async (req: Request, res: Response) => {
  try {
    const payments = await Payment.find({ user: req.params.id, itemType: "pdf", status: "approved" })
      .populate({ path: "item", select: "title description price fileUrl downloads" })
      .sort({ createdAt: -1 });
    res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching user PDFs:", error);
    res.status(500).json({ error: "Failed to fetch user PDFs" });
  }
};

// Get user payments
export const getUserPayments = async (req: Request, res: Response) => {
  try {
    const payments = await Payment.find({ user: req.params.id })
      .populate({ path: "item", select: "title" })
      .sort({ createdAt: -1 });
    res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching user payments:", error);
    res.status(500).json({ error: "Failed to fetch user payments" });
  }
};
