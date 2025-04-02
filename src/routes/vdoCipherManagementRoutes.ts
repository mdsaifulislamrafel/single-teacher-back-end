import { Router } from "express";
import {
  listVdoCipherVideos,
  deleteVdoCipherVideo,
} from "../controllers/vdoCipherManagementController";
import { authenticate, isAdmin } from "../middleware/auth";

const router = Router();

// Protected routes - only for admins
router.get("/", authenticate, isAdmin, listVdoCipherVideos);
router.delete("/:vdoCipherId", authenticate, isAdmin, deleteVdoCipherVideo);

export const vdoCipherManagementRoutes = router;
