import type { Request } from "express";
import UAParser from "ua-parser-js";

export const getDeviceInfo = (req: Request) => {
  const userAgent = req.headers["user-agent"] || "";
  const parser = new UAParser.UAParser(userAgent); // Note the double UAParser
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