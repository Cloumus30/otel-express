import { SpanStatusCode } from "@opentelemetry/api";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { ZipkinExporter } from "@opentelemetry/exporter-zipkin";
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { NodeSDK } from "@opentelemetry/sdk-node";
import dotenv from "dotenv";

// const traceExporter = new ZipkinExporter({
//   url: process.env.ZIPKIN_URL,
//   serviceName: "user-crud-service",
// });

const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_COLLECTOR_URL || "http://localhost:4317",
});

const logExporter = new OTLPLogExporter({
  url: "http://localhost:4318/v1/logs",
});

const sdk = new NodeSDK({
  serviceName: "user-crud-service",
  traceExporter: traceExporter,
  logRecordProcessor: new BatchLogRecordProcessor({ exporter: logExporter }),
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": { enabled: false },
      "@opentelemetry/instrumentation-winston": { enabled: false },
      // "@opentelemetry/instrumentation-http": {
      //   requestHook: (span, request) => {
      //     span.setAttribute("custom.request.url", request.method || "");
      //   },
      //   responseHook: (span, response) => {
      //     span.setAttribute("custom.response.status", response.statusCode || 0);
      //   },
      // },
    }),
  ],
});

sdk.start();
console.log("OpenTelemetry SDK Aktif dan mendengarkan");

const shutDown = () => {
  sdk
    .shutdown()
    .then(() => console.log("Tracing diberhentikan secara bersih"))
    .catch((err) => console.log("Tracer gagal menghentikan tracing:", err))
    .finally(() => process.exit(0));
};

process.on("SIGTERM", shutDown);
process.on("SIGINT", shutDown);
