// src/controllers/pagos_controller.js
import { registrarPagoPorDni } from "../services/pagos_service.js";

function esNumeroPositivo(n) {
  const x = Number(n);
  return Number.isFinite(x) && x > 0;
}

export async function registrarPago(req, res, next) {
  try {
    const { documento, tipo_plan_id, monto_pagado, metodo_pago } = req.body;

    // ✅ Validaciones básicas
    if (!documento || typeof documento !== "string") {
      return res.status(400).json({
        ok: false,
        codigo: "VALIDACION",
        mensaje: "documento es obligatorio y debe ser string",
      });
    }

    if (!/^\d+$/.test(documento.trim())) {
      return res.status(400).json({
        ok: false,
        codigo: "VALIDACION",
        mensaje: "documento debe contener solo números",
      });
    }

    if (!esNumeroPositivo(tipo_plan_id)) {
      return res.status(400).json({
        ok: false,
        codigo: "VALIDACION",
        mensaje: "tipo_plan_id es obligatorio y debe ser número > 0",
      });
    }

    if (!esNumeroPositivo(monto_pagado)) {
      return res.status(400).json({
        ok: false,
        codigo: "VALIDACION",
        mensaje: "monto_pagado es obligatorio y debe ser número > 0",
      });
    }

    // metodo_pago opcional pero recomendado
    const metodo = (metodo_pago ?? "").toString().trim();
    if (!metodo) {
      return res.status(400).json({
        ok: false,
        codigo: "VALIDACION",
        mensaje: "metodo_pago es obligatorio (ej: 'efectivo', 'transferencia')",
      });
    }

    // ✅ Llamada al service
    const resultado = await registrarPagoPorDni({
      documento: documento.trim(),
      tipo_plan_id: Number(tipo_plan_id),
      monto_pagado: Number(monto_pagado),
      metodo_pago: metodo,
    });

    // ✅ Manejo de respuestas del service
    if (!resultado.ok) {
      if (resultado.codigo === "NO_EXISTE") return res.status(404).json(resultado);
      if (resultado.codigo === "NO_ES_ALUMNO") return res.status(404).json(resultado);
      if (resultado.codigo === "PLAN_NO_EXISTE") return res.status(404).json(resultado);

      // errores de negocio típicos
      if (resultado.codigo === "VALIDACION") return res.status(400).json(resultado);

      // fallback
      return res.status(409).json(resultado);
    }

    return res.json(resultado);
  } catch (err) {
    next(err);
  }
}
