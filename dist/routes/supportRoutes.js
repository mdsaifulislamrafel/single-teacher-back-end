"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supportController_1 = require("../controllers/supportController");
const router = express_1.default.Router();
// Route for uploading PDF files
router.post("/", supportController_1.createSupport);
// Route for uploading video files to Vimeo
router.get("/:id", supportController_1.getSingleSupport);
router.get("/", supportController_1.getAllSupport);
router.patch("/:id", supportController_1.updateSupportStatus);
router.delete("/:id", supportController_1.deleteSupport);
exports.default = router;
