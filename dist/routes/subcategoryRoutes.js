"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const subcategoryController_1 = require("../controllers/subcategoryController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Public routes
router.get("/", subcategoryController_1.getSubcategories);
router.post("/", auth_1.authenticate, auth_1.isAdmin, subcategoryController_1.createSubcategory);
router.get("/:id/videos", subcategoryController_1.getSubcategoryVideos);
// Check for duplicate subcategory name in same category
router.get("/check-duplicate", subcategoryController_1.checkDuplicate);
// Admin routes
router.get("/:id", subcategoryController_1.getSubcategoryById);
router.put("/:id", auth_1.authenticate, auth_1.isAdmin, subcategoryController_1.updateSubcategory);
router.delete("/:id", auth_1.authenticate, auth_1.isAdmin, subcategoryController_1.deleteSubcategory);
exports.default = router;
