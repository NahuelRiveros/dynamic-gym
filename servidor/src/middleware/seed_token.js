import { timingSafeEqual } from "node:crypto";
import rateLimit from "express-rate-limit";
import { env } from "../configuracion_servidor/env.js";

/**
 * Rutas de mantenimiento (crear admin/staff, suscripción del software) que se usan desde Postman
 * con el header  x-seed-token: <SEED_SECRET>. Sin SEED_SECRET configurado quedan deshabilitadas.
 */
export function requireSeedToken(req, res, next) {
  const secret = env.SEED_SECRET;

  if (!secret) {
    return res.status(403).json({
      ok: false,
      codigo: "SEED_DESHABILITADO",
      mensaje: "Endpoints de seed deshabilitados en este entorno",
    });
  }

  // Comparación de tiempo constante: con `!==` se puede adivinar el secreto letra por letra midiendo tiempos.
  const token = Buffer.from(String(req.headers["x-seed-token"] ?? ""));
  const esperado = Buffer.from(secret);
  if (token.length !== esperado.length || !timingSafeEqual(token, esperado)) {
    return res.status(403).json({
      ok: false,
      codigo: "SEED_TOKEN_INVALIDO",
      mensaje: "Token de seed inválido",
    });
  }

  next();
}

// Sin límite se podría probar el SEED_SECRET a la fuerza.
export const seedLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, codigo: "DEMASIADOS_INTENTOS", mensaje: "Demasiados intentos. Intentá en 1 hora." },
});
