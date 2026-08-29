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

// ------------------------------------------------------------------
// 1. KONFIGURASI DINAMIS DARI ENVIRONMENT VARIABLES (.env)
// ------------------------------------------------------------------
const isOtelEnabled =
  import.meta.env.VITE_OTEL_ENABLED !== "false" &&
  import.meta.env.VITE_OTEL_ENABLED !== false;

const serviceName =
  import.meta.env.VITE_OTEL_SERVICE_NAME || "react-frontend-service";

const tracesEndpoint =
  import.meta.env.VITE_OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
  "http://localhost:4318/v1/traces";

const logsEndpoint =
  import.meta.env.VITE_OTEL_EXPORTER_OTLP_LOGS_ENDPOINT ||
  "http://localhost:4318/v1/logs";

/**
 * Menghasilkan daftar URL / Regex untuk propagasi W3C Traceparent Header (CORS)
 */
function getPropagateTraceUrls(): (string | RegExp)[] {
  const urls: (string | RegExp)[] = [/\/api\/.*/];

  // 1. Ambil domain origin dari VITE_API_BASE_URL jika ada
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (apiBaseUrl) {
    try {
      if (apiBaseUrl.startsWith("http://") || apiBaseUrl.startsWith("https://")) {
        const parsed = new URL(apiBaseUrl);
        urls.push(new RegExp(`^${parsed.origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/.*`));
      }
    } catch {
      // Abaikan jika format URL tidak valid
    }
  }

  // 2. Ambil domain tambahan dari VITE_OTEL_PROPAGATE_TRACE_URLS (comma-separated)
  const customUrls = import.meta.env.VITE_OTEL_PROPAGATE_TRACE_URLS;
  if (customUrls) {
    const list = customUrls.split(",").map((s: string) => s.trim()).filter(Boolean);
    for (const item of list) {
      try {
        if (item.startsWith("http://") || item.startsWith("https://")) {
          const parsed = new URL(item);
          urls.push(new RegExp(`^${parsed.origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/.*`));
        } else {
          urls.push(new RegExp(`^${item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/.*`));
        }
      } catch {
        urls.push(item);
      }
    }
  }

  // 3. Fallback default jika hanya ada regex /api/
  if (urls.length === 1) {
    urls.push(/http:\/\/localhost:3000\/.*/);
  }

  return urls;
}

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: serviceName,
});

// ------------------------------------------------------------------
// 2. INISIALISASI OPENTELEMETRY PROVIDERS
// ------------------------------------------------------------------
if (isOtelEnabled) {
  // A. Tracing Provider (Dengan BatchSpanProcessor)
  const traceExporter = new OTLPTraceExporter({
    url: tracesEndpoint,
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
    contextManager: new ZoneContextManager(), // Mempertahankan Trace Context di operasi asinkron
  });

  // B. Logging Provider (Dengan BatchLogRecordProcessor)
  const logExporter = new OTLPLogExporter({
    url: logsEndpoint,
  });

  const loggerProvider = new LoggerProvider({
    resource,
    processors: [
      new BatchLogRecordProcessor({
        exporter: logExporter,
        scheduledDelayMillis: 2000, // Buffer log & kirim batch tiap 2 detik
        maxExportBatchSize: 30,     // Maksimal 30 log record per batch
        maxQueueSize: 500,          // Batas aman buffer memori browser
      }),
    ],
  });

  logs.setGlobalLoggerProvider(loggerProvider);

  // C. Instrumentasi Otomatis (Mencegat Fetch & Axios/XHR)
  const propagateUrls = getPropagateTraceUrls();
  registerInstrumentations({
    instrumentations: [
      new XMLHttpRequestInstrumentation({
        propagateTraceHeaderCorsUrls: propagateUrls,
      }),
      new FetchInstrumentation({
        propagateTraceHeaderCorsUrls: propagateUrls,
      }),
    ],
  });

  console.log(
    `⚡ OpenTelemetry Traces & Logs initialized on React frontend (Service: ${serviceName}, Endpoint: ${tracesEndpoint})`
  );
} else {
  console.log("ℹ️ OpenTelemetry telemetry is disabled via VITE_OTEL_ENABLED=false");
}

// Export logger instance siap pakai untuk aplikasi React (No-op jika OTel tidak aktif)
export const frontendLogger = logs.getLogger(serviceName);
