/**
 * consulta_publica_router.js
 *
 * Ruta pública — NO requiere auth.
 * Permite a cualquier persona consultar su plan por DNI.
 */

import { Router } from "express";
import rateLimit from "express-rate-limit";
import { consultarPlanPorDni } from "../services/consulta_publica_service.js";
import { responderResultado } from "../nucleo/responder.js";

export const consultaPublicaRouter = Router();

// Es pública y devuelve nombre y apellido: sin límite se podrían probar DNIs de a miles para
// sacar la lista de alumnos. 30 consultas cada 15 minutos alcanzan de sobra para ver el propio plan.
const consultaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, codigo: "DEMASIADOS_INTENTOS", mensaje: "Demasiadas consultas. Probá de nuevo en unos minutos." },
});

// GET /api/consulta/plan/:dni (el formato del DNI lo revisa el servicio: VALIDACION "DNI inválido")
consultaPublicaRouter.get("/plan/:dni", consultaLimiter, async (req, res) => {
  const resultado = await consultarPlanPorDni(req.params.dni);
  return responderResultado(res, resultado, { NO_EXISTE: 404 });
});
