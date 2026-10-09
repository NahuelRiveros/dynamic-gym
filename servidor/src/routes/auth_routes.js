import { env } from "../configuracion_servidor/env.js";
import { Router } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { loginController, meController, logoutController, resetPasswordController } from "../controllers/auth_controller.js";
import { requireAuth, requireRole } from "../middleware/auth_middleware.js";
import { requireSeedToken, seedLimiter } from "../middleware/seed_token.js";
import { seedAdmin, seedStaff } from "../controllers/auth_seed_controller.js";
import { validar } from "../nucleo/validar.js";
import { z } from "../nucleo/zod.js";

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.LOGIN_MAX_INTENTOS,
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

const resetSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
  newPassword: z.string().trim().min(4, "La contraseña nueva debe tener al menos 4 caracteres"),
});

// Cambia la contraseña de cualquier cuenta sabiendo solo el email: únicamente el super admin.
authRouter.post("/reset-password", resetLimiter, requireAuth, requireRole("super_admin"), validar({ body: resetSchema }), resetPasswordController);
authRouter.post("/seed-admin", seedLimiter, requireSeedToken, seedAdmin);
authRouter.post("/seed-staff", seedLimiter, requireSeedToken, seedStaff);
authRouter.post("/login", loginLimiter, loginController);
authRouter.get("/me", requireAuth, meController);
authRouter.post("/logout", requireAuth, logoutController);
