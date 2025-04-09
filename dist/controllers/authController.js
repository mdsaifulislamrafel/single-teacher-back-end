"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.getCurrentUser = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const User_1 = __importStar(require("../models/User"));
const fs_1 = __importDefault(require("fs"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
// Helper function to generate JWT token
const generateToken = (id, role) => {
    return jsonwebtoken_1.default.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
};
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { name, email, password } = req.body;
        // Validate input
        const validatedData = User_1.UserSchema.parse({ name, email, password });
        // Check if email exists
        const existingUser = yield User_1.default.findOne({ email: validatedData.email });
        if (existingUser) {
            res.status(400).json({ error: "Email already in use" });
            return;
        }
        let avatarData;
        if (req.file) {
            try {
                const result = yield cloudinary_1.default.uploader.upload(req.file.path, {
                    folder: "user-avatars",
                    width: 500,
                    height: 500,
                    crop: "limit",
                });
                avatarData = {
                    public_id: result.public_id,
                    url: result.secure_url,
                };
            }
            catch (uploadError) {
                res.status(500).json({ error: "Failed to upload image" });
                return;
            }
            finally {
                fs_1.default.unlink(req.file.path, () => { });
            }
        }
        // Create user
        const user = yield User_1.default.create({
            name: validatedData.name,
            email: validatedData.email,
            password: validatedData.password,
            avatar: avatarData,
        });
        // Generate token
        const token = generateToken(user._id.toString(), user.role);
        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: (_a = user.avatar) === null || _a === void 0 ? void 0 : _a.url,
            },
        });
    }
    catch (error) {
        console.error("Registration error:", error);
        if (error instanceof zod_1.ZodError) {
            res.status(400).json({
                error: "Validation error",
                details: error.errors.map((e) => ({
                    field: e.path[0],
                    message: e.message,
                })),
            });
            return;
        }
        const errorMessage = error instanceof Error ? error.message : "Registration failed";
        res.status(500).json({ error: errorMessage });
    }
});
exports.register = register;
// Login user
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: "Email and password are required" });
            return;
        }
        // Find user
        const user = yield User_1.default.findOne({ email });
        if (!user) {
            res.status(401).json({ error: "Invalid credentials" });
            return;
        }
        // Check password
        const isPasswordValid = yield user.comparePassword(password);
        if (!isPasswordValid) {
            res.status(401).json({ error: "Invalid credentials" });
            return;
        }
        // Generate token
        const token = generateToken(user._id.toString(), user.role);
        res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error("Error logging in user:", error);
        res.status(500).json({ error: "Failed to login" });
    }
});
exports.login = login;
// Get current user
const getCurrentUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_1.default.findById(req.user.id).select("-password");
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.status(200).json({ user });
    }
    catch (error) {
        console.error("Error fetching current user:", error);
        res.status(500).json({ error: "Failed to fetch user" });
    }
});
exports.getCurrentUser = getCurrentUser;
