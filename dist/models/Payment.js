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
exports.PaymentSchema = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const zod_1 = require("zod");
// Zod Schema for validation
exports.PaymentSchema = zod_1.z.object({
    bankAccountNumber: zod_1.z.string().optional(),
    itemId: zod_1.z.string(),
    paymentMethod: zod_1.z.enum([
        "বিকাশ (bKash)",
        "নগদ (Nagad)",
        "রকেট (Rocket)",
        "ব্যাংক ট্রান্সফার (Bank)",
    ]),
    phoneNumber: zod_1.z.string().optional(),
    price: zod_1.z.union([zod_1.z.number(), zod_1.z.string()]).transform(Number), // support string or number
    status: zod_1.z.enum(["pending", "approved", "rejected"]).default("pending"),
    transactionId: zod_1.z.string().optional(), // ✅ optional
    user: zod_1.z.string(),
    itemType: zod_1.z.enum(["course", "pdf"]),
});
// Mongoose Schema
const paymentSchema = new mongoose_1.Schema({
    bankAccountNumber: {
        type: String,
    },
    itemId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        refPath: "itemType",
    },
    paymentMethod: {
        type: String,
        enum: [
            "বিকাশ (bKash)",
            "নগদ (Nagad)",
            "রকেট (Rocket)",
            "ব্যাংক ট্রান্সফার (Bank)",
        ],
        required: true,
    },
    phoneNumber: {
        type: String,
    },
    price: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
    },
    transactionId: {
        type: String,
        required: false, // ✅ optional now
    },
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    itemType: {
        type: String,
        enum: ["course", "pdf"],
        required: true,
    },
}, {
    timestamps: true,
});
exports.default = mongoose_1.default.model("Payment", paymentSchema);
