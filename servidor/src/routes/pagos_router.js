import { Router } from "express";
import { requireAuth , requireRole } from "../middleware/auth_middleware.js";
import { registrarPago, previewPago } from "../controllers/pagos_controller.js";
import { validar } from "../nucleo/validar.js";
import { dni, idPositivo, z } from "../nucleo/zod.js";

export const pagosRouter = Router();

const previewSchema = z.object({ documento: dni("documento es obligatorio (solo números)") });

const registrarSchema = z.object({
  documento: dni("documento es obligatorio (solo números)"),
  tipo_plan_id: idPositivo("tipo_plan_id es obligatorio y debe ser número > 0"),
  monto_pagado: z.coerce.number({ error: "monto_pagado es obligatorio y debe ser número > 0" }).positive("monto_pagado es obligatorio y debe ser número > 0"),
  metodo_pago: z.coerce.string().trim().min(1, "metodo_pago es obligatorio (ej: 'efectivo', 'transferencia')"),
});

pagosRouter.use(requireAuth,requireRole("staff","admin"));
pagosRouter.post("/registrar", validar({ body: registrarSchema }), registrarPago);
pagosRouter.get("/preview", validar({ query: previewSchema }), previewPago);
