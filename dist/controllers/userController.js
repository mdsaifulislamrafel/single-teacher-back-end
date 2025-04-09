"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserPayments = exports.getUserPDFs = exports.getUserCourses = exports.deleteUser = exports.updateUser = exports.getUserById = exports.getUsers = void 0;
const User_1 = __importDefault(require("../models/User"));
const Payment_1 = __importDefault(require("../models/Payment"));
const UserProgress_1 = __importDefault(require("../models/UserProgress"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
// Get all users
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield User_1.default.find().select("-password").sort({ createdAt: -1 });
        res.status(200).json(users);
    }
    catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});
exports.getUsers = getUsers;
// Get a single user by ID
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_1.default.findById(req.params.id).select("-password");
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.status(200).json(user);
    }
    catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ error: "Failed to fetch user" });
    }
});
exports.getUserById = getUserById;
// Update a user
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.id;
        // Find the user first
        const user = yield User_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        // Update name if provided
        if (req.body.name) {
            user.name = req.body.name;
        }
        // Handle password change if both passwords are provided
        if (req.body.currentPassword && req.body.newPassword) {
            const isMatch = yield user.comparePassword(req.body.currentPassword);
            if (!isMatch) {
                res.status(400).json({ error: "Current password is incorrect" });
                return;
            }
            user.password = req.body.newPassword; // This will trigger the pre-save hook
        }
        // Handle profile picture upload
        if (req.file) {
            try {
                console.log("Processing file upload:", req.file);
                // Delete previous avatar from cloudinary if exists
                if (user.avatar && user.avatar.public_id) {
                    console.log("Deleting previous avatar:", user.avatar.public_id);
                    yield cloudinary_1.default.uploader.destroy(user.avatar.public_id);
                }
                // Set new avatar
                user.avatar = {
                    public_id: req.file.filename,
                    url: req.file.path,
                };
            }
            catch (cloudinaryError) {
                console.error("Cloudinary error:", cloudinaryError);
                // Continue with user update even if cloudinary fails
            }
        }
        // Save the user
        const updatedUser = yield user.save();
        console.log("User updated successfully");
        // Return the user without password
        const userWithoutPassword = updatedUser.toObject();
        res.status(200).json(userWithoutPassword);
    }
    catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({
            error: error.message || "Failed to update user",
        });
    }
});
exports.updateUser = updateUser;
// Delete a user
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_1.default.findByIdAndDelete(req.params.id);
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        yield Payment_1.default.deleteMany({ user: req.params.id });
        yield UserProgress_1.default.deleteMany({ user: req.params.id });
        res.status(200).json({ message: "User deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: "Failed to delete user" });
    }
});
exports.deleteUser = deleteUser;
// Get user courses
const getUserCourses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userProgress = yield UserProgress_1.default.find({ user: req.params.id })
            .populate({ path: "subcategory", select: "name category", populate: { path: "category", select: "name" } })
            .populate("lastAccessedVideo", "title")
            .sort({ updatedAt: -1 });
        res.status(200).json(userProgress);
    }
    catch (error) {
        console.error("Error fetching user courses:", error);
        res.status(500).json({ error: "Failed to fetch user courses" });
    }
});
exports.getUserCourses = getUserCourses;
// Get user PDFs
const getUserPDFs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payments = yield Payment_1.default.find({ user: req.params.id, itemType: "pdf", status: "approved" })
            .populate({ path: "item", select: "title description price fileUrl downloads" })
            .sort({ createdAt: -1 });
        res.status(200).json(payments);
    }
    catch (error) {
        console.error("Error fetching user PDFs:", error);
        res.status(500).json({ error: "Failed to fetch user PDFs" });
    }
});
exports.getUserPDFs = getUserPDFs;
// Get user payments
const getUserPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payments = yield Payment_1.default.find({ user: req.params.id })
            .populate({ path: "item", select: "title" })
            .sort({ createdAt: -1 });
        res.status(200).json(payments);
    }
    catch (error) {
        console.error("Error fetching user payments:", error);
        res.status(500).json({ error: "Failed to fetch user payments" });
    }
});
exports.getUserPayments = getUserPayments;
