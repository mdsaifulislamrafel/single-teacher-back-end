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
exports.uploadToVdoCipher = void 0;
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const VDO_CIPHER_API_URL = 'https://dev.vdocipher.com/api/videos';
function getEnvVar(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing environment variable: ${name}`);
    }
    return value.trim();
}
const VDO_CIPHER_API_SECRET = getEnvVar('VDO_CIPHER_SECRET');
const VDO_CIPHER_FOLDER_ID = getEnvVar('VDO_CIPHER_FOLDER_ID');
// Function to get authorization headers
function getAuthHeaders(contentType = 'application/json') {
    return {
        'Authorization': `Apisecret a1b2c3d4e5f6g7h8i9j0`, // Ensure correct spacing
        'Accept': 'application/json',
        'Content-Type': contentType
    };
}
const uploadToVdoCipher = (filePath_1, title_1, ...args_1) => __awaiter(void 0, [filePath_1, title_1, ...args_1], void 0, function* (filePath, title, description = '') {
    var _a, _b, _c, _d, _e, _f;
    try {
        if (!fs_1.default.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        // 1. Initialize upload request
        const initResponse = yield axios_1.default.post(VDO_CIPHER_API_URL, {}, {
            params: { title, description, folderId: VDO_CIPHER_FOLDER_ID },
            headers: getAuthHeaders()
        });
        const { id: videoId, upload_link: uploadLink } = initResponse.data;
        // 2. Upload the file to the generated upload link
        const formData = new form_data_1.default();
        formData.append('file', fs_1.default.createReadStream(filePath));
        yield axios_1.default.post(uploadLink, formData, {
            headers: Object.assign(Object.assign({}, formData.getHeaders()), { 'Authorization': `Apisecret a1b2c3d4e5f6g7h8i9j0` }),
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });
        // 3. Finalize the video upload
        const finalizeResponse = yield axios_1.default.post(`${VDO_CIPHER_API_URL}/${videoId}/finalize`, {}, { headers: getAuthHeaders() });
        // 4. Generate OTP for playback
        const otpResponse = yield axios_1.default.post(`${VDO_CIPHER_API_URL}/${videoId}/otp`, { ttl: 300 }, // 5-minute expiry
        { headers: getAuthHeaders() });
        return {
            videoId,
            embedInfo: finalizeResponse.data.embed_info,
            otp: otpResponse.data.otp,
            playbackInfo: otpResponse.data.playbackInfo,
            duration: Math.round(finalizeResponse.data.duration)
        };
    }
    catch (error) {
        const axiosError = error;
        console.error('VdoCipher API Error:', {
            status: (_a = axiosError.response) === null || _a === void 0 ? void 0 : _a.status,
            message: ((_c = (_b = axiosError.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || 'Unknown error',
            request: {
                url: (_d = axiosError.config) === null || _d === void 0 ? void 0 : _d.url,
                method: (_e = axiosError.config) === null || _e === void 0 ? void 0 : _e.method,
                headers: (_f = axiosError.config) === null || _f === void 0 ? void 0 : _f.headers
            }
        });
        throw error;
    }
});
exports.uploadToVdoCipher = uploadToVdoCipher;
