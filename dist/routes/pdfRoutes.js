"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pdfController_1 = require("../controllers/pdfController");
const auth_1 = require("../middleware/auth");
const singlePdfUpdate_1 = require("../middleware/singlePdfUpdate");
const pdfUpload_1 = require("../middleware/pdfUpload");
const router = express_1.default.Router();
// Public routes
router.get("/", pdfController_1.getPDFs);
router.get("/:id", pdfController_1.getPDFById);
// User routes
// Admin routes
router.post('/', auth_1.authenticate, auth_1.isAdmin, pdfUpload_1.uploadPDFMiddleware, pdfController_1.createPDF);
router.put("/:id", auth_1.authenticate, auth_1.isAdmin, singlePdfUpdate_1.singlePdfUpdate, pdfController_1.updatePDF);
router.delete("/:id", auth_1.authenticate, auth_1.isAdmin, pdfController_1.deletePDF);
exports.default = router;
