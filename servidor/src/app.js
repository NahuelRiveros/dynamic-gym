import express from "express";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import routes from "./routes/index.js";
import { env } from "./configuracion_servidor/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// frontend/dist — se usa solo en modo local (NODE_ENV !== "production")
const rutaFrontend = path.resolve(__dirname, "../../frontend/dist");

// ── CORS ────────────────────────────────────────────────────────────────────
// PRODUCCIÓN : CORS_ORIGIN = "https://dynamic-gym.vercel.app"
// LOCAL      : CORS_ORIGIN vacío → permite todo (Vercel no aplica en localhost)
const corsOrigin = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : true;

export function createApp() {
  const app = express();

  app.use(helmet());

  // Reduce respuestas JSON/estáticos hasta un 70% — va ANTES de rutas
  app.use(compression());

  // "combined" en prod guarda IP + User-Agent; "dev" es legible en consola
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.use(express.json());
  app.use(cookieParser());
  app.use(cors({ origin: corsOrigin, credentials: true }));

  // ── API ──────────────────────────────────────────────────────────────────
  app.use("/api", routes);

  // ── Modo LOCAL: servir el frontend desde frontend/dist/ ──────────────────
  // En producción el frontend vive en Vercel — acá no hace falta.
  // En local el launcher puede hacer "Build frontend" y usar localhost:3001.
  if (env.NODE_ENV !== "production" && existsSync(rutaFrontend)) {
    app.use(express.static(rutaFrontend));

    // SPA fallback: cualquier ruta que no sea /api → index.html
    app.use((_req, res) => {
      res.sendFile(path.join(rutaFrontend, "index.html"));
    });

  } else {
    // ── Modo PRODUCCIÓN (Render): API pura ───────────────────────────────
    // El frontend está en Vercel, no servimos archivos estáticos.

    app.get("/", (_req, res) => {
      res.json({
        ok: true,
        nombre: "Dynamic Gym API",
        entorno: env.NODE_ENV,
        salud: "/api/health",
        frontend: "https://dynamic-gym.vercel.app",
      });
    });

    app.use((_req, res) => {
      res.status(404).json({
        ok: false,
        codigo: "NOT_FOUND",
        mensaje: "Ruta no encontrada. El API vive bajo /api/",
      });
    });
  }

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
