import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/user.routes";
import { httpLogger } from "./middlewares/httpLogger.middleware";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Centralized HTTP Response Logger Middleware
app.use(httpLogger);

// OpenTelemetry Middleware: Membuat Custom Span untuk Merekam Request & Response Body
// app.use((req, res, next) => {
//   tracer.startActiveSpan(`${req.method} ${req.path} [Payload]`, (span) => {
//     span.setAttribute("http.method", req.method);
//     span.setAttribute("http.url", req.originalUrl || req.url);

//     // 1. Rekam Request Body saat request masuk
//     if (req.body && Object.keys(req.body).length > 0) {
//       span.setAttribute("http.request.body", JSON.stringify(req.body));
//     }

//     let isSpanEnded = false;
//     const endSpan = () => {
//       if (!isSpanEnded) {
//         isSpanEnded = true;
//         span.end();
//       }
//     };

//     // 2. Intercept res.send untuk merekam Response Body & Status Code
//     const originalSend = res.send;
//     res.send = function (body) {
//       span.setAttribute("http.response.status_code", res.statusCode);

//       if (body) {
//         const responseData =
//           typeof body === "string" ? body : JSON.stringify(body);
//         span.setAttribute("http.response.body", responseData);
//       }

//       endSpan();
//       return originalSend.call(this, body);
//     };

//     // Fallback: pastikan span selalu ditutup jika response selesai
//     res.on("finish", endSpan);
//     res.on("close", endSpan);

//     next();
//   });
// });

// Health Check / Root route
app.get("/", (_req: Request, res: Response) => {
  return res.json({
    success: true,
    message: "Express.js + Prisma User CRUD API is running",
  });
});

// Routes
app.use("/api/users", userRoutes);

app.get("/test-error", (req, res) => {
  throw new Error("Database connection failed! (Simulasi Error OTel BARU)");
});

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(
    `Server is running on http://localhost:${PORT} [Hot Reload Active]`,
  );
});

export default app;
