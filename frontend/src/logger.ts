// src/logger.ts
import { logs, SeverityNumber } from "@opentelemetry/api-logs";

// Dapatkan instance logger global OTel yang telah kita daftarkan sebelumnya
const otelLogger = logs.getLogger("react-app-logger");

// Definisikan tipe opsional untuk metadata tambahan
export interface LogMeta {
  [key: string]: any;
}

export const logger = {
  /**
   * Log level INFO
   */
  info: (message: string, meta?: LogMeta) => {
    otelLogger.emit({
      severityNumber: SeverityNumber.INFO,
      severityText: "INFO",
      body: message,
      attributes: {
        ...meta,
        "log.origin": "browser",
      },
    });
    // Tetap tampilkan di console browser lokal untuk kenyamanan debugging
    console.log(`[INFO] ${message}`, meta || "");
  },

  /**
   * Log level WARN
   */
  warn: (message: string, meta?: LogMeta) => {
    otelLogger.emit({
      severityNumber: SeverityNumber.WARN,
      severityText: "WARN",
      body: message,
      attributes: {
        ...meta,
        "log.origin": "browser",
      },
    });
    console.warn(`[WARN] ${message}`, meta || "");
  },

  /**
   * Log level ERROR
   */
  error: (message: string, error?: Error | any, meta?: LogMeta) => {
    const errorDetails =
      error instanceof Error
        ? {
            "exception.message": error.message,
            "exception.stacktrace": error.stack,
            "exception.type": error.name,
          }
        : { "error.raw": JSON.stringify(error) };

    otelLogger.emit({
      severityNumber: SeverityNumber.ERROR,
      severityText: "ERROR",
      body: message,
      attributes: {
        ...meta,
        ...errorDetails,
        "log.origin": "browser",
      },
    });
    console.error(`[ERROR] ${message}`, error, meta || "");
  },
};
