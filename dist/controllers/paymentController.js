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
exports.updatePaymentStatus = exports.getPaymentById = exports.getPayments = exports.createPayment = void 0;
const Payment_1 = __importStar(require("../models/Payment"));
const User_1 = __importDefault(require("../models/User"));
const zod_1 = require("zod");
// Create Payment
const createPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Incoming request body:", req.body);
        // Validate input
        const validatedData = Payment_1.PaymentSchema.parse(req.body);
        // Check if payment already exists for the same itemId and user
        const isExistData = yield Payment_1.default.findOne({
            itemId: validatedData.itemId,
            user: validatedData.user,
        });
        if (isExistData) {
            res.status(409).json({
                error: "You have already submitted a payment for this item.",
            });
            return;
        }
        // Check if user exists
        const user = yield User_1.default.findById(validatedData.user);
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        // Create payment
        const payment = yield Payment_1.default.create(validatedData);
        res.status(201).json(payment);
    }
    catch (error) {
        console.error("Error creating payment:", error);
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.status(500).json({ error: "Failed to create payment" });
    }
});
exports.createPayment = createPayment;
// Get Payments
const getPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payments = yield Payment_1.default.find()
            .populate("user", "name email")
            .sort({ createdAt: -1 });
        if (!payments || payments.length === 0) {
            res.status(404).json({ error: "Payments not found" });
            return;
        }
        const populatedPayments = yield Promise.all(payments.map((payment) => __awaiter(void 0, void 0, void 0, function* () {
            if (payment.itemType === "course") {
                const populatedCourse = yield Payment_1.default.populate(payment, {
                    path: "itemId",
                    model: "Category",
                    populate: {
                        path: "subcategories",
                        model: "Subcategory",
                        populate: {
                            path: "videos",
                            model: "Video",
                        },
                    },
                });
                return populatedCourse;
            }
            else if (payment.itemType === "pdf") {
                const populatedPdf = yield Payment_1.default.populate(payment, {
                    path: "itemId",
                    model: "Pdf",
                });
                return populatedPdf;
            }
            else {
                return payment;
            }
        })));
        res.status(200).json(populatedPayments);
    }
    catch (error) {
        console.error("Error fetching payments:", error);
        res.status(500).json({ error: "Failed to fetch payments" });
    }
});
exports.getPayments = getPayments;
// Get Payment by ID
const getPaymentById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payments = yield Payment_1.default.find({ user: req.params.id })
            .populate("user", "name email");
        if (!payments || payments.length === 0) {
            res.status(404).json({ error: "Payment not found" });
            return;
        }
        const populatedPayments = yield Promise.all(payments.map((payment) => __awaiter(void 0, void 0, void 0, function* () {
            if (payment.itemType === "course") {
                const populatedCourse = yield Payment_1.default.populate(payment, {
                    path: "itemId",
                    model: "Category",
                    populate: {
                        path: "subcategories",
                        model: "Subcategory",
                        populate: {
                            path: "videos",
                            model: "Video",
                        },
                    },
                });
                return populatedCourse;
            }
            else if (payment.itemType === "pdf") {
                const populatedPdf = yield Payment_1.default.populate(payment, {
                    path: "itemId",
                    model: "Pdf",
                });
                return populatedPdf;
            }
            else {
                return payment;
            }
        })));
        res.status(200).json(populatedPayments);
    }
    catch (error) {
        console.error("Error fetching payment by ID:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.getPaymentById = getPaymentById;
// controllers/paymentController.ts
// Optional: Validate incoming body with Zod
const updatePaymentStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(["pending", "approved", "rejected"]),
});
// Update Payment Status
const updatePaymentStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Validate request body using Zod
        const parseResult = updatePaymentStatusSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                error: "Invalid status. Must be one of: pending, approved, or rejected",
                issues: parseResult.error.issues,
            });
            return;
        }
        const { status } = parseResult.data;
        // Find the payment by ID
        const payment = yield Payment_1.default.findById(id);
        if (!payment) {
            res.status(404).json({ error: "Payment not found" });
            return;
        }
        // Update the status
        payment.status = status;
        yield payment.save();
        res.status(200).json({
            message: "Payment status updated successfully",
            data: payment,
        });
    }
    catch (error) {
        console.error("Error updating payment status:", error);
        res.status(500).json({ error: "Failed to update payment status" });
    }
});
exports.updatePaymentStatus = updatePaymentStatus;
// Update payment status
// ✅ Update Payment Status Controller
