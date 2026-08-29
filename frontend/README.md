# Frontend React + TypeScript + OpenTelemetry

Aplikasi Frontend React (Vite) yang dilengkapi dengan observability **OpenTelemetry (Distributed Tracing & Structured Logging)** terintegrasi dengan backend Express.js dan OpenObserve / OTel Collector.

---

## ⚡ Fitur OpenTelemetry Frontend

1. **Auto-Instrumentation Tracing**:
   - Mencegat request jaringan HTTP (`fetch` & `XMLHttpRequest` / Axios) secara otomatis.
   - Menginjeksi header W3C `traceparent` ke backend untuk menghubungkan trace frontend dan backend menjadi 1 trace utuh (*Distributed Tracing*).
2. **Structured Logging (Batch Mode)**:
   - Mengirim log browser ke OTel Collector HTTP endpoint (`/v1/logs`) dengan batching memori aman.
   - Otomatis menyertakan metadata browser (`browser.url`, `browser.user_agent`, `browser.pathname`) dan Log-to-Trace correlation (`trace_id`, `span_id`).
3. **Konfigurasi Dinamis (.env)**:
   - Seluruh pengaturan OpenTelemetry dapat disesuaikan tanpa perlu mengubah kode sumber.

---

## ⚙️ Konfigurasi Environment Variables (`.env`)

Buat file `.env` di dalam folder `frontend/` (atau salin dari `.env.example`):

```env
# URL API Backend
VITE_API_BASE_URL=http://localhost:3000/api

# OpenTelemetry Settings
VITE_OTEL_ENABLED=true
VITE_OTEL_SERVICE_NAME=react-frontend-service
VITE_OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces
VITE_OTEL_EXPORTER_OTLP_LOGS_ENDPOINT=http://localhost:4318/v1/logs
VITE_OTEL_PROPAGATE_TRACE_URLS=http://localhost:3000
```

---

## 🔍 Cara Kerja CORS Trace Propagation (`getPropagateTraceUrls`)

OpenTelemetry di browser membutuhkan daftar izin URL untuk menyisipkan header W3C `traceparent`. Hal ini bertujuan untuk **mencegah CORS error** saat memanggil third-party API (seperti Google Fonts/Analytics/Payment Gateway) dan **mencegah kebocoran data internal**.

### 1. Bagaimana URL Dicocokkan?

- **Panggilan Full URL Backend (misal `http://localhost:3000/get-users` atau `http://localhost:3000/api/*`)**:
  - Otomatis terdeteksi karena origin `http://localhost:3000` otomatis diekstrak menjadi regex `^http:\/\/localhost:3000\/.*`.
  - Semua rute di belakang origin tersebut (seperti `/get-users`, `/auth`, `/products`) **otomatis cocok dan mendapatkan header `traceparent`**.

- **Panggilan Path Relatif (misal `fetch('/api/users')` atau `fetch('/get-users')`)**:
  - Secara default menangkap pola `/api/.*`.
  - Jika backend Anda menggunakan rute non-standard tanpa prefix `/api` (misalnya `/get-users` atau `/auth/login` yang diproxy lewat Vite/Nginx), Anda dapat mendaftarkannya di `.env`:
    ```env
    VITE_OTEL_PROPAGATE_TRACE_URLS=http://localhost:3000,/get-users,/auth
    ```

---

## 🏃 Menjalankan Aplikasi

```bash
# Install dependencies
npm install

# Jalankan server development
npm run dev

# Build untuk production
npm run build
```

