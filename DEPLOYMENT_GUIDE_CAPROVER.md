# Panduan Deployment OpenObserve & OpenTelemetry Collector di CapRover

Dokumen ini memuat panduan lengkap arsitektur dan langkah-langkah deployment stack Observability (**OpenObserve** dan **OpenTelemetry Collector**) beserta integrasinya dengan **Express.js Backend** pada platform PaaS **CapRover**.

---

## 1. Arsitektur Jaringan Internal CapRover

Di CapRover, setiap container berjalan di dalam Docker Swarm Overlay Network (`captain-overlay-network`). Antar-container berkomunikasi secara privat, cepat, dan aman melalui internal hostname dengan format:

* **OpenObserve Service:** `srv-captain--openobserve` (Port default: `5080`)
* **OpenTelemetry Collector:** `srv-captain--otel-collector` (Port `4317` gRPC Traces & Port `4318` HTTP Logs)
* **Express.js Backend:** `srv-captain--<nama-app-backend>`

```mermaid
graph LR
    Express["Express App (srv-captain--backend)"] -->|gRPC / HTTP: 4317 / 4318| Collector["OTel Collector (srv-captain--otel-collector)"]
    Collector -->|OTLP/HTTP: 5080| OpenObserve["OpenObserve (srv-captain--openobserve)"]
    User["Developer / Browser"] -->|HTTPS: openobserve.domainanda.com| OpenObserve
```

---

## 2. Langkah 1: Deployment OpenObserve

1. Buka Web Dashboard CapRover > Masuk ke menu **Apps** > Klik tombol **Create New App**.
2. Masukkan konfigurasi awal:
   * **App Name:** `openobserve`
   * **Centang (Check):** `Has Persistent Data`
   * Klik **Create New App**.
3. Masuk ke detail aplikasi **openobserve**:
   * Buka tab **App Configs**:
     * **Environmental Variables:**
       ```env
       ZO_DATA_DIR=/data
       ZO_ROOT_USER_EMAIL=admin@example.com
       ZO_ROOT_USER_PASSWORD=ComplexPass#123
       ```
     * **Persistent Directories:**
       * Path in Host: `/captain/data/openobserve` *(atau biarkan default)*
       * Path in Container: `/data`
     * Klik **Save & Update**.
4. Masuk ke tab **Deployment**:
   * Di bagian **Method 6: Deploy via ImageName**:
     * Masukkan Image Name: `openobserve/openobserve:latest`
     * Klik **Deploy**.
5. Masuk ke tab **HTTP Settings**:
   * Masukkan **Container Port:** `5080`
   * Hubungkan Custom Domain (misal: `openobserve.domainanda.com`).
   * Klik **Enable HTTPS** untuk mengaktifkan sertifikat SSL gratis (Let's Encrypt).

---

## 3. Langkah 2: Konfigurasi & Deployment OpenTelemetry Collector

### 3.1. File Konfigurasi: `otel-collector-config.yaml`
Pastikan pipeline logs dan traces aktif, serta exporter mengarah ke internal hostname `srv-captain--openobserve`:

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 1s
    send_batch_size: 256

  filter/drop_unwanted:
    error_mode: ignore
    traces:
      span:
        - 'attributes["http.target"] == "/favicon.ico"'
        - 'attributes["http.target"] == "/healthz"'

  transform/scrub_sensitive:
    error_mode: ignore
    trace_statements:
      - context: span
        statements:
          - replace_pattern(attributes["http.request.body"], "password\":\"[^\"]+\"", "password\":\"[REDACTED]\"")

exporters:
  otlphttp/openobserve:
    # Mengarah ke hostname internal OpenObserve di jaringan CapRover
    endpoint: "http://srv-captain--openobserve:5080/api/default"
    headers:
      # Base64 dari admin@example.com:ComplexPass#123
      Authorization: "Basic YWRtaW5AZXhhbXBsZS5jb206Q29tcGxleFBhc3MjMTIz"
      organization: default
      stream-name: default
    tls:
      insecure: true

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch, filter/drop_unwanted, transform/scrub_sensitive]
      exporters: [otlphttp/openobserve]

    logs:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlphttp/openobserve]
```

### 3.2. File `Dockerfile` untuk Collector
Buat file `Dockerfile` pada folder collector (agar konfigurasi ter-bundle otomatis ke dalam container):

```dockerfile
FROM otel/opentelemetry-collector-contrib:latest
COPY otel-collector-config.yaml /etc/otel-collector-config.yaml
CMD ["--config=/etc/otel-collector-config.yaml"]
```

### 3.3. File `captain-definition`
```json
{
  "schemaVersion": 2,
  "dockerfilePath": "./Dockerfile"
}
```

### 3.4. Deploy ke CapRover
1. Buat app baru di CapRover dengan nama **`otel-collector`** *(tanpa persistent data)*.
2. Satukan file `captain-definition`, `Dockerfile`, dan `otel-collector-config.yaml` ke dalam arsip file `.tar` atau `.zip`.
3. Upload melalui tab **Deployment** pada app `otel-collector` (atau gunakan perintah `caprover deploy`).
4. **Port Mapping (Opsional)**:
   * Jika backend Express.js berada di CapRover yang sama, **tidak perlu buka port publik**.
   * Jika backend berada di luar cluster CapRover, buka port di **App Configs > Port Mapping**:
     * `4317:4317`
     * `4318:4318`

---

## 4. Langkah 3: Integrasi Backend Express.js

### 4.1. Environment Variables Aplikasi Express.js di CapRover
Tambahkan variable berikut pada tab **App Configs** aplikasi backend Anda di CapRover:

```env
OTEL_COLLECTOR_URL=http://srv-captain--otel-collector:4317
OTEL_LOGS_URL=http://srv-captain--otel-collector:4318/v1/logs
```

### 4.2. Inisialisasi SDK (`src/instrumentation.ts`)
```typescript
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { NodeSDK } from "@opentelemetry/sdk-node";

const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_COLLECTOR_URL || "http://srv-captain--otel-collector:4317",
});

const logExporter = new OTLPLogExporter({
  url: process.env.OTEL_LOGS_URL || "http://srv-captain--otel-collector:4318/v1/logs",
});

const sdk = new NodeSDK({
  serviceName: "user-crud-service",
  traceExporter: traceExporter,
  logRecordProcessor: new BatchLogRecordProcessor({ exporter: logExporter }),
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": { enabled: false },
    }),
  ],
});

sdk.start();
```

---

## 5. Verifikasi dan Monitoring

1. Akses Dashboard OpenObserve melalui domain publik Anda (contoh: `https://openobserve.domainanda.com`).
2. Login menggunakan kredensial root:
   * **Username:** `admin@example.com`
   * **Password:** `ComplexPass#123`
3. Kirimkan beberapa request ke endpoint API Express.js.
4. Periksa data pada menu:
   * **Traces:** Pastikan service `user-crud-service` muncul lengkap dengan span request-nya.
   * **Logs:** Pastikan log JSON terstruktur dari Winston tercatat dengan rapi.
   * **Sanitization:** Pastikan data sensitif seperti password telah disamarkan menjadi `[REDACTED]`.
