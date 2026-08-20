import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { ZipkinExporter } from "@opentelemetry/exporter-zipkin";
import { NodeSDK } from "@opentelemetry/sdk-node";

const traceExporter = new ZipkinExporter({
    url: 'http://localhost:9411/api/v2/spans',
    serviceName: "user-crud-service"
})

const sdk = new NodeSDK({
    serviceName: "user-crud-service",
    traceExporter: traceExporter,
    instrumentations: [
        getNodeAutoInstrumentations({
            '@opentelemetry/instrumentation-fs': { enabled: false },
        })
    ]
});

sdk.start();
console.log("OpenTelemetry SDK Aktif dan mendengarkan");

const shutDown = () => {
    sdk.shutdown()
        .then(() => console.log("Tracing diberhentikan secara bersih"))
        .catch((err) => console.log("Tracer gagal menghentikan tracing:", err))
        .finally(() => process.exit(0));
};

process.on("SIGTERM", shutDown);
process.on("SIGINT", shutDown);

