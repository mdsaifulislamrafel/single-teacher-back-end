import express from "express"
import { register, login, getCurrentUser, logoutAllDevices, logout, singleDevice, forgotPassword, resetPassword, validateResetToken, googleAuth } from "../controllers/authController"
import { authenticate } from "../middleware/auth"
import upload from "../middleware/upload"

const router = express.Router()

router.post("/register", upload.single("avatar"), register)
router.post("/login", login)
router.get("/me", authenticate, getCurrentUser)
router.post("/logout-all-devices", logoutAllDevices)
router.post("/logout", authenticate, logout)
router.get("/deviceInfo/:id", authenticate, singleDevice)
// In your authRoutes.ts
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);
router.get('/validate-reset-token/:token', validateResetToken);
router.post("/google", googleAuth);

export default router
