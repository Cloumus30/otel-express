import { OpenTelemetryTransportV3 } from "@opentelemetry/winston-transport";
import winston from "winston";

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json() // Format default JSON agar terstruktur
  ),
  transports: [
    // 1. Tetap cetak log ke terminal console (agar mudah dibaca secara lokal)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // 2. Kirim secara otomatis ke OpenTelemetry Logs SDK
    new OpenTelemetryTransportV3()
  ]
});