import type { Request, Response } from "express";
import User from "../models/User";
import Payment from "../models/Payment";
import UserProgress from "../models/UserProgress";

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
export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

// Update a user
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { password, ...updateData } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (error: any) {
    console.error("Error updating user:", error);
    res.status(error.errors ? 400 : 500).json({ error: error.errors || "Failed to update user" });
  }
};

// Delete a user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
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
