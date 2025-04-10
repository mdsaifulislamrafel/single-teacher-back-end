import express from "express"
import { register, login, getCurrentUser, logoutAllDevices, logout } from "../controllers/authController"
import { authenticate } from "../middleware/auth"
import upload from "../middleware/upload"

const router = express.Router()

router.post("/register", upload.single("avatar"), register)
router.post("/login", login)
router.get("/me", authenticate, getCurrentUser)
router.post("/logout-all-devices", logoutAllDevices)
router.post("/logout", authenticate, logout)

export default router
