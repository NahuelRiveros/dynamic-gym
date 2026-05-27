import { Router } from "express";
import { loginController, meController, logoutController, resetPasswordController } from "../controllers/auth_controller.js";
import { requireAuth } from "../middleware/auth_middleware.js";
import { seedAdmin, seedStaff } from "../controllers/auth_seed_controller.js";
import { env } from "../configuracion_servidor/env.js";

export const authRouter = Router();

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

  const token = req.headers["x-seed-token"];
  if (!token || token !== secret) {
    return res.status(403).json({
      ok: false,
      codigo: "SEED_TOKEN_INVALIDO",
      mensaje: "Token de seed inválido",
    });
  }

  next();
}

authRouter.post("/reset-password", resetPasswordController);
authRouter.post("/seed-admin", requireSeedToken, seedAdmin);
authRouter.post("/seed-staff", requireSeedToken, seedStaff);
authRouter.post("/login", loginController);
authRouter.get("/me", requireAuth, meController);
authRouter.post("/logout", requireAuth, logoutController);
