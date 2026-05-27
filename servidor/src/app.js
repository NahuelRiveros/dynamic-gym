import express from "express";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import routes from "./routes/index.js";
import { env } from "./configuracion_servidor/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rutaFrontend = path.resolve(__dirname, "../../frontend/dist");

// ── CORS ───────────────────────────────────────────────────────────────────
// Si CORS_ORIGIN está seteado, solo permite ese dominio.
// Si está vacío, permite cualquier origen (ok cuando el front vive en el
// mismo servidor Express como en producción en Render).
const corsOrigin = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : true;

export function createApp() {
  const app = express();

  app.use(helmet());

  // ── Compresión gzip ───────────────────────────────────────────────────────
  // Reduce el tamaño de las respuestas JSON y archivos estáticos hasta un 70%.
  // Debe ir ANTES de las rutas y archivos estáticos.
  app.use(compression());

  // En producción "combined" guarda IP, User-Agent, etc. para auditoría.
  // En desarrollo "dev" es más legible en consola.
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.use(express.json());
  app.use(cookieParser());
  app.use(cors({ origin: corsOrigin, credentials: true }));

  app.use("/api", routes);

  app.use(express.static(rutaFrontend));

  app.get("/*splat", (_req, res) => {
    res.sendFile(path.join(rutaFrontend, "index.html"));
  });

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
      mensaje: "Error interno",
    });
  });

  return app;
}