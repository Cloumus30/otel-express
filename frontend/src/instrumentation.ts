import {
  WebTracerProvider,
  BatchSpanProcessor,
} from "@opentelemetry/sdk-trace-web";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { XMLHttpRequestInstrumentation } from "@opentelemetry/instrumentation-xml-http-request";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { ZoneContextManager } from "@opentelemetry/context-zone";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

// Impor modul Logging SDK OTel dengan Batching Processor
import {
  LoggerProvider,
  BatchLogRecordProcessor,
} from "@opentelemetry/sdk-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { logs } from "@opentelemetry/api-logs";

const serviceName = "react-frontend-service";

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: serviceName,
});

// ------------------------------------------------------------------
// A. INISIALISASI TRACING PROVIDER (Dengan BatchSpanProcessor)
// ------------------------------------------------------------------
// Kirim trace ke endpoint OTel Collector HTTP (Port 4318)
const traceExporter = new OTLPTraceExporter({
  url: "http://localhost:4318/v1/traces",
});

const tracerProvider = new WebTracerProvider({
  resource,
  spanProcessors: [
    new BatchSpanProcessor(traceExporter, {
      scheduledDelayMillis: 2000, // Kirim batch setiap 2 detik
      maxExportBatchSize: 30,     // Maksimal 30 span per request
    }),
  ],
});

tracerProvider.register({
  contextManager: new ZoneContextManager(), // Mempertahankan Trace Context di seluruh operasi asinkron
});

// ------------------------------------------------------------------
// B. INISIALISASI LOGGING PROVIDER (Dengan BatchLogRecordProcessor)
// ------------------------------------------------------------------
// Kirim log ke endpoint OTel Collector HTTP (Port 4318)
const logExporter = new OTLPLogExporter({
  url: "http://localhost:4318/v1/logs",
});

const loggerProvider = new LoggerProvider({
  resource,
  processors: [
    new BatchLogRecordProcessor({
      exporter: logExporter,
      scheduledDelayMillis: 2000, // Buffer log di memori & kirim batch tiap 2 detik
      maxExportBatchSize: 30,     // Maksimal 30 log record per batch
      maxQueueSize: 500,          // Batas aman buffer memori browser
    }),
  ],
});

// Daftarkan secara global agar bisa dipanggil oleh logger kustom
logs.setGlobalLoggerProvider(loggerProvider);

// Export logger instance siap pakai untuk aplikasi React
export const frontendLogger = logs.getLogger(serviceName);

// ------------------------------------------------------------------
// C. INSTRUMENTASI OTOMATIS (Mencegat Fetch & Axios/XHR)
// ------------------------------------------------------------------
registerInstrumentations({
  instrumentations: [
    new XMLHttpRequestInstrumentation({
      propagateTraceHeaderCorsUrls: [
        /http:\/\/localhost:3000\/.*/, // Domain API backend Express
        /\/api\/.*/,                   // Relatif API URL jika lewat Vite proxy
      ],
    }),
    new FetchInstrumentation({
      propagateTraceHeaderCorsUrls: [
        /http:\/\/localhost:3000\/.*/,
        /\/api\/.*/,
      ],
    }),
  ],
});

console.log("⚡ OpenTelemetry Traces & Logs (Batch Mode) initialized on React frontend...");
