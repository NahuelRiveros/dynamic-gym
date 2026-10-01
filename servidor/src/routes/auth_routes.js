import { timingSafeEqual } from "node:crypto";
import { Router } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { loginController, meController, logoutController, resetPasswordController } from "../controllers/auth_controller.js";
import { requireAuth, requireRole } from "../middleware/auth_middleware.js";
import { seedAdmin, seedStaff } from "../controllers/auth_seed_controller.js";
import { env } from "../configuracion_servidor/env.js";
import { validar } from "../nucleo/validar.js";
import { z } from "../nucleo/zod.js";

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${ipKeyGenerator(req)}:${req.body?.usuario || req.body?.email || ""}`,
  message: { ok: false, codigo: "DEMASIADOS_INTENTOS", mensaje: "Demasiados intentos. Intentá en 15 minutos." },
});

const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, codigo: "DEMASIADOS_INTENTOS", mensaje: "Demasiados intentos de recuperación. Intentá en 1 hora." },
});

// ── Middleware: protege los endpoints de seed con token secreto ──────────────
// Requiere header:  x-seed-token: <SEED_SECRET>
// Si SEED_SECRET no está configurado en .env → endpoints deshabilitados
function requireSeedToken(req, res, next) {
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

const resetSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
  newPassword: z.string().trim().min(4, "La contraseña nueva debe tener al menos 4 caracteres"),
});

// Cambia la contraseña de cualquier cuenta sabiendo solo el email: únicamente el super admin.
authRouter.post("/reset-password", resetLimiter, requireAuth, requireRole("super_admin"), validar({ body: resetSchema }), resetPasswordController);
// Mismo límite que la recuperación: sin él se podría probar el SEED_SECRET a la fuerza.
authRouter.post("/seed-admin", resetLimiter, requireSeedToken, seedAdmin);
authRouter.post("/seed-staff", resetLimiter, requireSeedToken, seedStaff);
authRouter.post("/login", loginLimiter, loginController);
authRouter.get("/me", requireAuth, meController);
authRouter.post("/logout", requireAuth, logoutController);
