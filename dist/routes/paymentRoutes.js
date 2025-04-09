"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const paymentController_1 = require("../controllers/paymentController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// User routes
router.post("/", auth_1.authenticate, paymentController_1.createPayment);
// Admin routes
router.get("/", auth_1.authenticate, auth_1.isAdmin, paymentController_1.getPayments);
// router.get("/pending", authenticate, isAdmin, getPendingPayments)
router.get("/:id", auth_1.authenticate, paymentController_1.getPaymentById);
router
    .route("/:id/status")
    .patch(auth_1.authenticate, auth_1.isAdmin, paymentController_1.updatePaymentStatus)
    .put(auth_1.authenticate, auth_1.isAdmin, paymentController_1.updatePaymentStatus);
exports.default = router;
