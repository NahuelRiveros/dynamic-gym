import { Router } from "express";
import { registrarIngreso } from "../controllers/ingreso_controller.js";
import { requireAuth, requireRole } from "../middleware/auth_middleware.js";
import { estadoCola } from "../services/offline_queue_service.js";

export const ingresoRouter = Router();

ingresoRouter.use(requireAuth, requireRole("staff", "admin"));

// Registrar ingreso por DNI (soporta modo offline automáticamente)
ingresoRouter.post("/registrar", registrarIngreso);

// Estado de la cola offline — útil para el Launcher y diagnóstico
ingresoRouter.get("/cola-offline", (_req, res) => {
  res.json({ ok: true, cola: estadoCola() });
});
