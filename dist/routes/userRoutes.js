"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const upload_1 = __importDefault(require("../middleware/upload"));
const router = express_1.default.Router();
// Admin routes
router.get("/", auth_1.authenticate, auth_1.isAdmin, userController_1.getUsers);
router.delete("/:id", auth_1.authenticate, auth_1.isAdmin, userController_1.deleteUser);
// User routes
router.get("/:id", auth_1.authenticate, (req, res, next) => {
    // Allow users to access their own data
    if (req.user.id === req.params.id || req.user.role === "admin") {
        return next();
    }
    res.status(403).json({ error: "Unauthorized" });
}, userController_1.getUserById);
router.put("/:id", auth_1.authenticate, (req, res, next) => {
    // Allow users to update their own data
    if (req.user.id === req.params.id || req.user.role === "admin") {
        return next();
    }
    res.status(403).json({ error: "Unauthorized" });
}, upload_1.default.single("avatar"), // ফিল্ড নাম "avatar" রাখা হয়েছে
userController_1.updateUser);
router.get("/:id/courses", auth_1.authenticate, (req, res, next) => {
    // Allow users to access their own courses
    if (req.user.id === req.params.id || req.user.role === "admin") {
        return next();
    }
    res.status(403).json({ error: "Unauthorized" });
}, userController_1.getUserCourses);
router.get("/:id/pdfs", auth_1.authenticate, (req, res, next) => {
    // Allow users to access their own PDFs
    if (req.user.id === req.params.id || req.user.role === "admin") {
        return next();
    }
    res.status(403).json({ error: "Unauthorized" });
}, userController_1.getUserPDFs);
router.get("/:id/payments", auth_1.authenticate, (req, res, next) => {
    // Allow users to access their own payments
    if (req.user.id === req.params.id || req.user.role === "admin") {
        return next();
    }
    res.status(403).json({ error: "Unauthorized" });
}, userController_1.getUserPayments);
exports.default = router;
