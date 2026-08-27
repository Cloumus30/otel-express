import { Request, Response, NextFunction } from "express";
import { logger } from "../logger";

const SENSITIVE_KEYS = [
  "password",
  "confirmpassword",
  "token",
  "refreshtoken",
  "accesstoken",
  "secret",
  "authorization",
  "creditcard",
];

/**
 * Rekursif menyamarkan data sensitif dalam object/array
 */
const sanitizePayload = (data: any): any => {
  if (!data) return data;

  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      return sanitizePayload(parsed);
    } catch {
      return data;
    }
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizePayload(item));
  }

  if (typeof data === "object") {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = sanitizePayload(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  return data;
};

/**
 * Middleware untuk mencatat log setiap respon HTTP API ke Winston/OpenTelemetry
 */
export const httpLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const startTime = process.hrtime.bigint();

  let responseBody: any = null;

  // Intercept res.send untuk menangkap data response body
  const originalSend = res.send;
  res.send = function (body: any): Response {
    responseBody = body;
    return originalSend.call(this, body);
  };

  // Dengarkan saat response selesai dikirim ke client
  res.on("finish", () => {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;

    const statusCode = res.statusCode;
    const method = req.method;
    const url = req.originalUrl || req.url;

    // Tentukan log level secara dinamis berdasarkan status code
    let logLevel: "info" | "warn" | "error" = "info";
    if (statusCode >= 500) {
      logLevel = "error";
    } else if (statusCode >= 400) {
      logLevel = "warn";
    }

    // Parsing dan sanitasi body request & response
    const sanitizedReqBody =
      req.body && Object.keys(req.body).length > 0
        ? sanitizePayload(req.body)
        : undefined;

    const sanitizedResBody = sanitizePayload(responseBody);

    const logMeta = {
      http: {
        method,
        url,
        statusCode,
        durationMs: Number(durationMs.toFixed(2)),
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.get("user-agent") || undefined,
        requestBody: sanitizedReqBody,
        responseBody: sanitizedResBody,
      },
    };

    const logMessage = `HTTP ${method} ${url} ${statusCode} - ${durationMs.toFixed(2)}ms`;

    logger[logLevel](logMessage, logMeta);
  });

  next();
};
