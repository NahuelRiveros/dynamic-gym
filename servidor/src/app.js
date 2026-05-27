import express from "express";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes/index.js";
import { env } from "./configuracion_servidor/env.js";

// ── CORS ────────────────────────────────────────────────────────────────────
// El frontend vive en Vercel (https://dynamic-gym.vercel.app).
// El backend DEBE permitir ese origen explícitamente.
//
// En Render seteá: CORS_ORIGIN=https://dynamic-gym.vercel.app
// Múltiples orígenes separados por coma: "https://a.vercel.app,https://custom.com"
// Vacío / sin setear = permite TODOS los orígenes (solo para desarrollo local)
const corsOrigin = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : true;

export function createApp() {
  const app = express();

  app.use(helmet());

  // ── Compresión gzip ──────────────────────────────────────────────────────
  // Reduce el tamaño de las respuestas JSON hasta un 70%.
  // Va ANTES de las rutas para comprimir todo.
  app.use(compression());

  // En producción "combined" guarda IP + User-Agent para auditoría.
  // En desarrollo "dev" es más legible en consola.
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.use(express.json());
  app.use(cookieParser());
  app.use(cors({ origin: corsOrigin, credentials: true }));

  // ── API ──────────────────────────────────────────────────────────────────
  app.use("/api", routes);

  // ── Ruta raíz informativa ────────────────────────────────────────────────
  // El frontend vive en Vercel — este servidor es solo API.
  // Si alguien visita la URL del backend directamente, ve esto.
  app.get("/", (_req, res) => {
    res.json({
      ok: true,
      nombre: "Dynamic Gym API",
      entorno: env.NODE_ENV,
      salud: "/api/health",
      frontend: "https://dynamic-gym.vercel.app",
    });
  });

  // ── 404 ──────────────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({
      ok: false,
      codigo: "NOT_FOUND",
      mensaje: "Ruta no encontrada. El API vive bajo /api/",
    });
  });

  // ── Error handler global ─────────────────────────────────────────────────
  app.use((err, _req, res, _next) => {
    if (err?.type === "entity.parse.failed") {
      return res.status(400).json({
        ok: false,
        codigo: "JSON_INVALIDO",
        mensaje: "Body JSON inválido",
      });
    }

    console.error(err);
    return res.status(500).json({
      ok: false,
      codigo: "ERROR",
      mensaje: "Error interno del servidor",
    });
  });

  return app;
}
