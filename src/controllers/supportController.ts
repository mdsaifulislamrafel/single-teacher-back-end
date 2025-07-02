import type { Request, Response } from "express";
import { Support } from "../models/Support";

// interface MulterRequest extends Request {
//   file?: Express.Multer.File;
// }

export const createSupport = async (
  req: Request,
  res: Response
): Promise<void> => {
  const supportData = Support.create(req.body);
  if (!supportData) {
    res.status(400).json({ error: "Failed to create support request" });
    return;
  }
  res.status(201).json({
    message: "Support request created successfully",
    supportData,
  });
};

export const getSingleSupport = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.params.id;
  try {
    const supportData = await Support.find({ user: userId });

    if (!supportData) {
      res.status(404).json({ error: "Support request not found" });
      return;
    }

    res.status(200).json({
      message: "Support request retrieved successfully",
      supportData,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllSupport = async (req: Request, res: Response) => {
  try {
    const supports = await Support.find({});
    res.status(200).json({
      message: "Support request retrieved successfully",
    supports,
    });
  } catch (error) {
    console.error("Error fetching supports:", error);
    res.status(500).json({ error: "Failed to fetch supports" });
  }
}

export const updateSupportStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { isActive } = req.body;

  try {
    const updatedSupport = await Support.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    );

    if (!updatedSupport) {
      res.status(404).json({ error: "Support request not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Support ${isActive ? "activated" : "deactivated"}`,
      supportData: updatedSupport,
    });
  } catch (error) {
    console.error("Error updating support status:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const deleteSupport = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    const deletedSupport = await Support.findByIdAndDelete(id);

    if (!deletedSupport) {
      res.status(404).json({ error: "Support request not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Support request deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting support request:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};