import { registrarPagoPorDni, previewPagoPorDni } from "../services/pagos_service.js";

function esNumeroPositivo(n) {
  const x = Number(n);
  return Number.isFinite(x) && x > 0;
}

export async function previewPago(req, res, next) {
  try {
    const documento = String(req.query.documento ?? "").trim();

    if (!documento) {
      return res.status(400).json({
        ok: false,
        codigo: "VALIDACION",
        mensaje: "documento es obligatorio",
      });
    }

    if (!/^\d+$/.test(documento.replace(/[.\s]/g, ""))) {
      return res.status(400).json({
        ok: false,
        codigo: "VALIDACION",
        mensaje: "documento inválido (solo números)",
      });
    }

    const r = await previewPagoPorDni({ documento });

    if (!r.ok) {
      if (r.codigo === "NO_EXISTE" || r.codigo === "NO_ES_ALUMNO") {
        return res.status(404).json(r);
      }
      return res.status(409).json(r);
    }

    return res.json(r);
  } catch (err) {
    next(err);
  }
}

export async function registrarPago(req, res, next) {
  try {
    const { documento, tipo_plan_id, monto_pagado, metodo_pago } = req.body;

    if (!req.user?.usuario_id) {
      return res.status(401).json({
        ok: false,
        codigo: "NO_AUTH_USUARIO",
        mensaje: "No se pudo identificar el usuario que registra el pago",
      });
    }

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

    const metodo = (metodo_pago ?? "").toString().trim();
    if (!metodo) {
      return res.status(400).json({
        ok: false,
        codigo: "VALIDACION",
        mensaje: "metodo_pago es obligatorio (ej: 'efectivo', 'transferencia')",
      });
    }

    const resultado = await registrarPagoPorDni({
      documento: documento.trim(),
      tipo_plan_id: Number(tipo_plan_id),
      monto_pagado: Number(monto_pagado),
      metodo_pago: metodo,
      usuario_id_cobro: req.user.usuario_id,
      modificado_por: req.user?.usuario_id ?? null,
    });

    if (!resultado.ok) {
      if (resultado.codigo === "NO_EXISTE") return res.status(404).json(resultado);
      if (resultado.codigo === "NO_ES_ALUMNO") return res.status(404).json(resultado);
      if (resultado.codigo === "PLAN_NO_EXISTE") return res.status(404).json(resultado);
      if (resultado.codigo === "VALIDACION") return res.status(400).json(resultado);

      return res.status(409).json(resultado);
    }

    return res.json(resultado);
  } catch (err) {
    next(err);
  }
}