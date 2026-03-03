import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes/index.js";
import { env } from "./configuracion_servidor/env.js";
import { sequelize } from "./database/sequelize.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(morgan("dev"));
  app.use(express.json());
  app.use(cookieParser());

  app.use(
    cors({
      origin: env.CORS_ORIGIN ? [env.CORS_ORIGIN] : true,
      credentials: true,
    })
  );

  // ✅ PONER ANTES DE routes
  app.get("/", (_req, res) => res.send("API Dynamic Gym OK"));
  app.get("/health", (_req, res) => res.json({ ok: true, status: "up" }));
  app.get("/debug/db", async (_req, res) => {
    const [r] = await sequelize.query("select now() as ahora");
    res.json({ ok: true, r });
  });

  app.get("/debug/usuario-admin", async (_req, res) => {
    const persona = await GymPersona.findOne({ where: { gym_persona_email: "admin@gym.com" } });
    const usuario = await GymUsuario.findOne({ where: { gym_usuario_rela_persona: persona?.gym_persona_id } });
    res.json({ persona_id: persona?.gym_persona_id, usuario });
  });
  // Rutas API
  app.use(routes);

  // error handler para JSON inválido / errores
  app.use((err, _req, res, _next) => {
    if (err?.type === "entity.parse.failed") {
      return res
        .status(400)
        .json({ ok: false, codigo: "JSON_INVALIDO", mensaje: "Body JSON inválido" });
    }
    console.error(err);
    return res.status(500).json({ ok: false, codigo: "ERROR", mensaje: "Error interno" });
  });

  return app;
}