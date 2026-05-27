/**
 * consulta_publica_router.js
 *
 * Ruta pública — NO requiere auth.
 * Permite a cualquier persona consultar su plan por DNI.
 */

import { Router } from "express";
import { consultarPlanPorDni } from "../services/consulta_publica_service.js";

export const consultaPublicaRouter = Router();

// GET /api/consulta/plan/:dni
consultaPublicaRouter.get("/plan/:dni", async (req, res, next) => {
  try {
    const { dni } = req.params;

    if (!dni || String(dni).trim() === "") {
      return res.status(400).json({
        ok:      false,
        codigo:  "VALIDACION",
        mensaje: "El DNI es requerido",
      });
    }

    const resultado = await consultarPlanPorDni(dni);

    if (!resultado.ok) {
      const status = resultado.codigo === "NO_EXISTE" ? 404 : 400;
      return res.status(status).json(resultado);
    }

    return res.json(resultado);
  } catch (err) {
    next(err);
  }
});
