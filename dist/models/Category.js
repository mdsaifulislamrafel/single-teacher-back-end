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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategorySchema = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const zod_1 = require("zod");
// Zod validation schema
exports.CategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Name must be at least 2 characters"),
    description: zod_1.z.string().min(10, "Description must be at least 10 characters"),
    image: zod_1.z.string().url("Invalid image URL"),
    price: zod_1.z.string(),
    imagePublicId: zod_1.z.string().optional(),
});
// Mongoose schema
const categorySchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        unique: true,
        trim: true,
    },
    description: {
        type: String,
        required: [true, "Description is required"],
        trim: true,
    },
    image: {
        type: String,
        required: [true, "Image URL is required"],
        validate: {
            validator: (value) => {
                try {
                    new URL(value);
                    return true;
                }
                catch (_a) {
                    return false;
                }
            },
            message: "Invalid image URL",
        },
    },
    price: {
        type: String,
        required: [true, "Price is required"],
    },
    imagePublicId: {
        type: String,
        select: false,
    },
    subcategories: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Subcategory",
        },
    ],
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: (doc, ret) => {
            delete ret.__v;
            delete ret.imagePublicId;
            return ret;
        },
    },
    toObject: {
        virtuals: true,
    },
});
// Index for better search performance
// categorySchema.index({ name: 1 });
// Create and export the model
exports.default = mongoose_1.default.model("Category", categorySchema);
