import express from "express";
import { register, login, getCurrentUser } from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import upload from "../middleware/upload";

const router = express.Router();

router.post('/register', upload.single('avatar'), register);
router.post("/login", login);
router.get('/me', authenticate, getCurrentUser);

export default router;