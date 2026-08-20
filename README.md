# Express.js + TypeScript + Prisma CRUD User with OpenTelemetry & Zipkin

Backend RESTful API CRUD User yang dibangun dengan **Express.js**, **TypeScript**, dan **Prisma ORM** (database SQLite), terintegrasi penuh dengan **OpenTelemetry** untuk distributed tracing ke dashboard **Zipkin**, serta dilengkapi fitur **Hot Reload** menggunakan **Nodemon** + **ts-node**.

---

## 🚀 Fitur Utama

- **TypeScript Native**: Type-safety end-to-end dari routing, controller, hingga skema database.
- **CRUD User Lengkap**: Create, Read (All & By ID), Update, dan Delete.
- **Keamanan Password**: Hashing password menggunakan `bcryptjs` dan pengecualian otomatis field password pada JSON response.
- **Format Response Standar**: Seluruh endpoint menggunakan standardized JSON response envelope `{ success, message, data?, error? }`.
- **Prisma ORM & SQLite**: File-based database lokal yang cepat tanpa perlu instalasi database server eksternal.
- **OpenTelemetry Tracing**:
  - Auto-instrumentation untuk HTTP & Express request lifecycle.
  - Query tracing untuk operasi database Prisma (`previewFeatures = ["tracing"]`).
  - Penanganan error kustom & span recording pada endpoint `/test-error`.
  - Exporter trace langsung ke Zipkin collector (`http://localhost:9411/api/v2/spans`).
- **Development Hot Reload**: Auto-restart instan saat berkas kode di folder `src/` diubah via Nodemon.

---

## 🛠️ Tech Stack & Library

| Kategori | Teknologi / Library |
| :--- | :--- |
| **Runtime & Language** | Node.js, TypeScript |
| **Web Framework** | Express.js |
| **Database & ORM** | SQLite, Prisma ORM (`@prisma/client`, `prisma`) |
| **Security** | `bcryptjs` (Password hashing), `cors` |
| **Dev Tools** | `nodemon`, `ts-node`, `dotenv` |
| **Observability (OTel)** | `@opentelemetry/api`, `@opentelemetry/sdk-node`, `@opentelemetry/auto-instrumentations-node`, `@opentelemetry/exporter-zipkin` |

---

## 📁 Struktur Folder Project

```text
expressjs-backend/
├── prisma/
│   ├── dev.db                      # Database SQLite lokal (ter-generate)
│   ├── migrations/                 # Riwayat migrasi database
│   └── schema.prisma               # Skema model User & konfigurasi generator
├── src/
│   ├── controllers/
│   │   └── user.controller.ts      # Controller handler CRUD User & hashing
│   ├── lib/
│   │   └── prisma.ts               # Singleton Prisma Client
│   ├── routes/
│   │   └── user.routes.ts          # Definisi route endpoint User
│   ├── types/
│   │   └── response.ts             # Interface ApiResponse
│   ├── instrumentation.ts          # Inisialisasi OpenTelemetry NodeSDK & Zipkin Exporter
│   └── index.ts                    # Server entrypoint Express
├── .env                            # Variabel environment
├── .gitignore                      # Git ignore rules
├── nodemon.json                    # Konfigurasi watcher & preloader OTel
├── package.json                    # Script & dependensi proyek
├── README.md                       # Dokumentasi proyek
└── tsconfig.json                   # Konfigurasi TypeScript
```

---

## ⚙️ Prasyarat (Prerequisites)

1. **Node.js** versi `>= 18.x`
2. **npm** versi `>= 9.x`
3. **Docker** (untuk menjalankan Zipkin dashboard)

---

## 📦 Instalasi & Setup

1. **Masuk ke direktori project**:
   ```bash
   cd expressjs-backend
   ```

2. **Instal seluruh dependensi**:
   ```bash
   npm install
   ```

3. **Pastikan file `.env` sudah ada**:
   ```env
   PORT=3000
   DATABASE_URL="file:./dev.db"
   ```

4. **Inisialisasi Database & Generate Prisma Client**:
   ```bash
   npx prisma migrate dev --name init
   ```

---

## 🐳 Menjalankan Zipkin dengan Docker

Jalankan container Zipkin di port `9411`:

```bash
docker run -d -p 9411:9411 --name zipkin openzipkin/zipkin
```

Buka browser dan akses dashboard Zipkin di:  
👉 **[http://localhost:9411](http://localhost:9411)**

---

## 🏃 Menjalankan Aplikasi

### Mode Development (Hot Reload + OpenTelemetry Preloaded)
```bash
npm run dev
```
> Server akan otomatis berjalan di `http://localhost:3000` dengan OpenTelemetry SDK aktif mendengarkan dan mengirimkan data trace ke Zipkin.

### Mode Produksi (Build & Start)
```bash
# Kompilasi TypeScript ke JavaScript (folder dist/)
npm run build

# Menjalankan aplikasi hasil build
npm start
```

### Membuka Prisma Studio (GUI Database)
```bash
npx prisma studio
```

---

## 📡 Dokumentasi Endpoint API

Base URL: `http://localhost:3000`

### 1. Health Check
- **URL**: `GET /`
- **Response**:
  ```json
  {
    "success": true,
    "message": "Express.js + Prisma User CRUD API is running"
  }
  ```

---

### 2. Create User
- **URL**: `POST /api/users`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "password": "secretpassword123"
  }
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "User created successfully",
    "data": {
      "id": "423206be-5293-44c9-ade0-0d6a6edb0eaf",
      "name": "John Doe",
      "username": "johndoe",
      "email": "john@example.com",
      "createdAt": "2026-08-20T15:48:03.975Z",
      "updatedAt": "2026-08-20T15:48:03.975Z"
    }
  }
  ```

---

### 3. Get All Users
- **URL**: `GET /api/users`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Users retrieved successfully",
    "data": [
      {
        "id": "423206be-5293-44c9-ade0-0d6a6edb0eaf",
        "name": "John Doe",
        "username": "johndoe",
        "email": "john@example.com",
        "createdAt": "2026-08-20T15:48:03.975Z",
        "updatedAt": "2026-08-20T15:48:03.975Z"
      }
    ]
  }
  ```

---

### 4. Get User By ID
- **URL**: `GET /api/users/:id`
- **Example**: `GET /api/users/423206be-5293-44c9-ade0-0d6a6edb0eaf`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "User retrieved successfully",
    "data": {
      "id": "423206be-5293-44c9-ade0-0d6a6edb0eaf",
      "name": "John Doe",
      "username": "johndoe",
      "email": "john@example.com",
      "createdAt": "2026-08-20T15:48:03.975Z",
      "updatedAt": "2026-08-20T15:48:03.975Z"
    }
  }
  ```

---

### 5. Update User
- **URL**: `PUT /api/users/:id`
- **Request Body**:
  ```json
  {
    "name": "John Doe Updated",
    "username": "johndoe_updated"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "User updated successfully",
    "data": {
      "id": "423206be-5293-44c9-ade0-0d6a6edb0eaf",
      "name": "John Doe Updated",
      "username": "johndoe_updated",
      "email": "john@example.com",
      "createdAt": "2026-08-20T15:48:03.975Z",
      "updatedAt": "2026-08-20T15:52:10.120Z"
    }
  }
  ```

---

### 6. Delete User
- **URL**: `DELETE /api/users/:id`
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "User deleted successfully"
  }
  ```

---

### 7. Test Error & Custom OTel Span Recording
- **URL**: `GET /test-error`
- **Deskripsi**: Menstimulasi error 500 sekaligus merekam exception dan mengubah status span menjadi `ERROR` pada OpenTelemetry.
- **Response (`500 Internal Server Error`)**:
  ```json
  {
    "success": false,
    "message": "Database connection failed! (Simulasi Error OTel)"
  }
  ```

---

## 🔍 Cara Melihat Tracing di Zipkin

1. Jalankan aplikasi (`npm run dev`).
2. Kirim beberapa request ke API (misalnya `POST /api/users` atau `GET /test-error`).
3. Buka browser ke **http://localhost:9411**.
4. Pada filter **Service Name**, pilih `user-crud-service` dan klik **RUN QUERY**.
5. Klik pada salah satu trace untuk melihat:
   - Timeline durasi request HTTP Express.
   - Child span query Prisma (SELECT / INSERT).
   - Detail error, stack trace, status code HTTP, dan metadata lainnya.
