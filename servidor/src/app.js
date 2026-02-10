import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes/index.js";


export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(morgan("dev"));
  app.use(express.json());
  app.use(cookieParser());
  app.use(cors({ origin: true, credentials: true }));

  app.use(routes);

  // error handler para JSON inválido
  app.use((err, _req, res, _next) => {
    if (err?.type === "entity.parse.failed") {
      return res.status(400).json({ ok: false, codigo: "JSON_INVALIDO", mensaje: "Body JSON inválido" });
    }
    console.error(err);
    return res.status(500).json({ ok: false, codigo: "ERROR", mensaje: "Error interno" });
  });

  return app;
}
