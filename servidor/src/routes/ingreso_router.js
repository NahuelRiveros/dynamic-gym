import { Router } from "express";
import { registrarIngreso } from "../controllers/ingreso_controller.js";
import { requireAuth, requireRole } from "../middleware/auth_middleware.js";
import { estadoCola } from "../services/offline_queue_service.js";
import { validar } from "../nucleo/validar.js";
import { z } from "../nucleo/zod.js";

export const ingresoRouter = Router();

ingresoRouter.use(requireAuth, requireRole("staff", "admin"));

// El formato del DNI (solo números, sin puntos) lo revisa el servicio: responde VALIDACION
// con el mismo código que el kiosco ya sabe mostrar.
const ingresoSchema = z.object({ dni: z.string({ error: "El DNI es obligatorio y debe ser texto" }).min(1, "El DNI es obligatorio") });

ingresoRouter.post("/registrar", validar({ body: ingresoSchema }), registrarIngreso);

// Estado de la cola offline — útil para el Launcher y diagnóstico
ingresoRouter.get("/cola-offline", (_req, res) => {
  res.json({ ok: true, cola: estadoCola() });
});
