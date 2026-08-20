import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/user.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check / Root route
app.get("/", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Express.js + Prisma User CRUD API is running",
  });
});

// Routes
app.use("/api/users", userRoutes);

app.get("/test-error", (req, res)=>{
   try {
    throw new Error('Database connection failed! (Simulasi Error OTel)');
  } catch (error) {
    // Kita juga bisa mendapatkan tracer aktif jika ingin merekam error secara kustom
    const opentelemetry = require('@opentelemetry/api');
    const activeSpan = opentelemetry.trace.getActiveSpan();
    const err = error as Error;
    if (activeSpan) {
      activeSpan.recordException(err);
      
      activeSpan.setStatus({ code: opentelemetry.SpanStatusCode.ERROR, message: err.message });
    }

    res.status(500).json({ success: false, message: err.message });
  }
})

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT} [Hot Reload Active]`);
});

export default app;
