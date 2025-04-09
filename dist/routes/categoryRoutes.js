"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const categoryController_1 = require("../controllers/categoryController");
const auth_1 = require("../middleware/auth");
const upload_1 = __importDefault(require("../middleware/upload"));
const router = express_1.default.Router();
// Public routes
router.get("/", categoryController_1.getCategories);
router.post("/", auth_1.authenticate, auth_1.isAdmin, upload_1.default.single('image'), categoryController_1.createCategory);
router.get("/:id/subcategories", categoryController_1.getCategorySubcategories);
// Admin routes
router.get("/:id", categoryController_1.getCategoryById);
router.put("/:id", auth_1.authenticate, auth_1.isAdmin, upload_1.default.single('image'), categoryController_1.updateCategory);
router.delete("/:id", auth_1.authenticate, auth_1.isAdmin, categoryController_1.deleteCategory);
exports.default = router;
