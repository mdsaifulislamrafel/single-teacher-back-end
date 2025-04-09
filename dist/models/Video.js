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
exports.VideoSchema = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const zod_1 = require("zod");
exports.VideoSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, { message: "Title is required" }),
    description: zod_1.z.string().optional(),
    vdoCipherId: zod_1.z.string().min(1, { message: "VdoCipher ID is required" }),
    duration: zod_1.z.number().positive(),
    subcategory: zod_1.z.string().min(1, { message: "Subcategory ID is required" }),
    playbackInfo: zod_1.z.string().optional(),
    // isPlaying: z.boolean().default(false),
});
const videoSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    description: { type: String },
    vdoCipherId: { type: String, required: true },
    duration: { type: Number, required: true, default: 0 },
    subcategory: { type: mongoose_1.Schema.Types.ObjectId, ref: "Subcategory", required: true },
    playbackInfo: { type: String },
    // isPlaying: { type: Boolean, default: false },
}, { timestamps: true });
exports.default = mongoose_1.default.model("Video", videoSchema);
