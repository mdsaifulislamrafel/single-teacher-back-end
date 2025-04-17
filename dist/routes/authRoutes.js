"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const upload_1 = __importDefault(require("../middleware/upload"));
const router = express_1.default.Router();
router.post("/register", upload_1.default.single("avatar"), authController_1.register);
router.post("/login", authController_1.login);
router.get("/me", auth_1.authenticate, authController_1.getCurrentUser);
router.post("/logout-all-devices", authController_1.logoutAllDevices);
router.post("/logout", auth_1.authenticate, authController_1.logout);
router.get("/deviceInfo/:id", auth_1.authenticate, authController_1.singleDevice);
// In your authRoutes.ts
router.post("/forgot-password", authController_1.forgotPassword);
router.put("/reset-password/:token", authController_1.resetPassword);
router.get('/validate-reset-token/:token', authController_1.validateResetToken);
router.post("/google", authController_1.googleAuth);
exports.default = router;
