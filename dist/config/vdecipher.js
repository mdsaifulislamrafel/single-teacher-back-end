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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listVideos = exports.deleteVdoCipherVideo = exports.getVideoInfo = exports.uploadVideoToVdoCipher = exports.getUploadInfo = exports.VdoCipherUploadError = exports.VdoCipherQuotaError = exports.VdoCipherError = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const form_data_1 = __importDefault(require("form-data"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const VDOCIPHER_API_SECRET = process.env.VDOCIPHER_API_SECRET || "wpbIP2C5BjBM5POiFW6nGWHmQsSJeclXaVUWKzGIGpzERVU7MxtyYJNtp0aXQJBG";
class VdoCipherError extends Error {
    constructor(message) {
        super(message);
        this.name = "VdoCipherError";
    }
}
exports.VdoCipherError = VdoCipherError;
class VdoCipherQuotaError extends VdoCipherError {
    constructor(message) {
        super(message);
        this.name = "VdoCipherQuotaError";
    }
}
exports.VdoCipherQuotaError = VdoCipherQuotaError;
class VdoCipherUploadError extends VdoCipherError {
    constructor(message) {
        super(message);
        this.name = "VdoCipherUploadError";
    }
}
exports.VdoCipherUploadError = VdoCipherUploadError;
const vdoCipherClient = axios_1.default.create({
    baseURL: "https://dev.vdocipher.com/api",
    headers: {
        Authorization: `Apisecret ${VDOCIPHER_API_SECRET}`,
        "Content-Type": "application/json",
        Accept: "application/json",
    },
    timeout: 30000,
});
const getUploadInfo = (title) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const response = yield vdoCipherClient.put(`/videos?title=${encodeURIComponent(title)}`, {});
        if (!((_a = response.data) === null || _a === void 0 ? void 0 : _a.videoId) || !((_b = response.data) === null || _b === void 0 ? void 0 : _b.clientPayload)) {
            throw new VdoCipherError("Invalid response structure from VdoCipher API");
        }
        const { clientPayload } = response.data;
        // Verify all required fields are present
        const requiredFields = [
            'policy',
            'key',
            'x-amz-signature',
            'x-amz-algorithm',
            'x-amz-date',
            'x-amz-credential',
            'uploadLink'
        ];
        for (const field of requiredFields) {
            if (!clientPayload[field]) {
                throw new VdoCipherError(`Missing required field: ${field}`);
            }
        }
        // Decode the policy to verify conditions
        const policy = JSON.parse(Buffer.from(clientPayload.policy, 'base64').toString());
        console.log("Policy conditions:", policy.conditions);
        return {
            videoId: response.data.videoId,
            uploadUrl: clientPayload.uploadLink,
            uploadFields: {
                key: clientPayload.key,
                policy: clientPayload.policy,
                'x-amz-algorithm': clientPayload['x-amz-algorithm'],
                'x-amz-credential': clientPayload['x-amz-credential'],
                'x-amz-date': clientPayload['x-amz-date'],
                'x-amz-signature': clientPayload['x-amz-signature'],
                'success_action_status': '201', // Required by S3 policy
                'success_action_redirect': '' // Required by policy condition
            }
        };
    }
    catch (error) {
        // Error handling remains the same
        // ...
    }
});
exports.getUploadInfo = getUploadInfo;
const uploadVideoToVdoCipher = (filePath, uploadInfo) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!fs_1.default.existsSync(filePath)) {
            throw new VdoCipherUploadError("File not found");
        }
        const formData = new form_data_1.default();
        const fileStats = fs_1.default.statSync(filePath);
        // Add all required fields including empty redirect
        for (const [key, value] of Object.entries(uploadInfo.uploadFields)) {
            formData.append(key, value);
        }
        // Add file with metadata
        formData.append("file", fs_1.default.createReadStream(filePath), {
            filename: path_1.default.basename(filePath),
            contentType: "video/mp4",
            knownLength: fileStats.size
        });
        console.log("Final form data fields:", Object.keys(formData));
        const response = yield axios_1.default.post(uploadInfo.uploadUrl, formData, {
            headers: Object.assign(Object.assign({}, formData.getHeaders()), { 'Content-Length': formData.getLengthSync() }),
            timeout: 600000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });
        if (response.status !== 201) {
            throw new VdoCipherUploadError(`Upload failed with status ${response.status}`);
        }
        return true;
    }
    catch (error) {
        // console.error("Upload error details:", error.response?.data || error.message);
        throw new VdoCipherUploadError(`Failed to upload video: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
});
exports.uploadVideoToVdoCipher = uploadVideoToVdoCipher;
// ... rest of the functions (getVideoInfo, deleteVdoCipherVideo, listVideos) ...
const getVideoInfo = (videoId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield vdoCipherClient.get(`/videos/${videoId}`);
        return response.data;
    }
    catch (error) {
        throw new VdoCipherError(`Failed to get video info: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
});
exports.getVideoInfo = getVideoInfo;
const deleteVdoCipherVideo = (videoId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        if (!videoId || typeof videoId !== "string") {
            console.warn("Invalid VdoCipher ID:", videoId);
            throw new VdoCipherError("Invalid video ID");
        }
        if (!VDOCIPHER_API_SECRET) {
            throw new VdoCipherError("VdoCipher API secret is not configured");
        }
        console.log(`Attempting to delete video from VdoCipher: ${videoId}`);
        // For V2 API, the API secret is passed as a query parameter
        const url = `https://api.vdocipher.com/v2/videos/${videoId}?clientSecretKey=${VDOCIPHER_API_SECRET}`;
        const response = yield axios_1.default.delete(url, {
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        });
        console.log("VdoCipher delete response:", response.data);
        return response.data;
    }
    catch (error) {
        console.error("VdoCipher deletion error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        // Check if the error is because the video doesn't exist (already deleted)
        if (((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) === 404) {
            console.log(`Video ${videoId} not found in VdoCipher (may have been already deleted)`);
            return { message: "Video not found or already deleted" };
        }
        throw new VdoCipherError(`Failed to delete video: ${((_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.message) || error.message || "Unknown error"}`);
    }
});
exports.deleteVdoCipherVideo = deleteVdoCipherVideo;
const listVideos = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield vdoCipherClient.get("/videos");
        return response.data;
    }
    catch (error) {
        throw new VdoCipherError(`Failed to list videos: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
});
exports.listVideos = listVideos;
exports.default = {
    getUploadInfo: exports.getUploadInfo,
    uploadVideoToVdoCipher: exports.uploadVideoToVdoCipher,
    getVideoInfo: exports.getVideoInfo,
    deleteVdoCipherVideo: exports.deleteVdoCipherVideo,
    listVideos: exports.listVideos,
    VdoCipherError,
    VdoCipherQuotaError,
    VdoCipherUploadError,
};
