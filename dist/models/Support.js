"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Support = void 0;
const mongoose_1 = require("mongoose");
const supportSchema = new mongoose_1.Schema({
    category: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Category",
        required: [true, "Category is required"],
    },
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User is required"],
    },
    isActive: {
        type: Boolean,
        default: true,
        required: [true, "Active status is required"],
    },
    meetingLink: {
        type: String,
        required: [true, "Meeting link is required"],
    },
    supportStartTime: {
        type: String,
        required: [true, "Support start time is required"],
    },
    supportEndTime: {
        type: String,
        required: [true, "Support end time is required"],
    },
}, {
    timestamps: true,
});
exports.Support = (0, mongoose_1.model)("Support", supportSchema);
