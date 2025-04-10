"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeviceInfo = void 0;
const ua_parser_js_1 = __importDefault(require("ua-parser-js"));
const getDeviceInfo = (req) => {
    const userAgent = req.headers["user-agent"] || "";
    const parser = new ua_parser_js_1.default.UAParser(userAgent); // Note the double UAParser
    const browser = parser.getBrowser();
    const os = parser.getOS();
    return {
        userAgent,
        ip: req.ip || req.socket.remoteAddress || "",
        browser: `${browser.name || ""} ${browser.version || ""}`.trim(),
        os: `${os.name || ""} ${os.version || ""}`.trim(),
        device: parser.getDevice(),
        engine: parser.getEngine(),
        cpu: parser.getCPU()
    };
};
exports.getDeviceInfo = getDeviceInfo;
