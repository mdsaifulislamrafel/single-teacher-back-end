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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSupport = exports.updateSupportStatus = exports.getAllSupport = exports.getSingleSupport = exports.createSupport = void 0;
const Support_1 = require("../models/Support");
// interface MulterRequest extends Request {
//   file?: Express.Multer.File;
// }
const createSupport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const supportData = Support_1.Support.create(req.body);
    if (!supportData) {
        res.status(400).json({ error: "Failed to create support request" });
        return;
    }
    res.status(201).json({
        message: "Support request created successfully",
        supportData,
    });
});
exports.createSupport = createSupport;
const getSingleSupport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.id;
    try {
        const supportData = yield Support_1.Support.find({ user: userId });
        if (!supportData) {
            res.status(404).json({ error: "Support request not found" });
            return;
        }
        res.status(200).json({
            message: "Support request retrieved successfully",
            supportData,
        });
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.getSingleSupport = getSingleSupport;
const getAllSupport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const supports = yield Support_1.Support.find({});
        res.status(200).json({
            message: "Support request retrieved successfully",
            supports,
        });
    }
    catch (error) {
        console.error("Error fetching supports:", error);
        res.status(500).json({ error: "Failed to fetch supports" });
    }
});
exports.getAllSupport = getAllSupport;
const updateSupportStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { isActive } = req.body;
    try {
        const updatedSupport = yield Support_1.Support.findByIdAndUpdate(id, { isActive }, { new: true, runValidators: true });
        if (!updatedSupport) {
            res.status(404).json({ error: "Support request not found" });
            return;
        }
        res.status(200).json({
            success: true,
            message: `Support ${isActive ? "activated" : "deactivated"}`,
            supportData: updatedSupport,
        });
    }
    catch (error) {
        console.error("Error updating support status:", error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.updateSupportStatus = updateSupportStatus;
const deleteSupport = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const deletedSupport = yield Support_1.Support.findByIdAndDelete(id);
        if (!deletedSupport) {
            res.status(404).json({ error: "Support request not found" });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Support request deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting support request:", error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});
exports.deleteSupport = deleteSupport;
