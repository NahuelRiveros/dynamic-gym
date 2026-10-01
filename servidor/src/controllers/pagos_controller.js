import { registrarPagoPorDni, previewPagoPorDni } from "../services/pagos_service.js";
import { responderResultado } from "../nucleo/responder.js";

export async function previewPago(req, res) {
  const r = await previewPagoPorDni({ documento: req.datos.query.documento });
  return responderResultado(res, r, { NO_EXISTE: 404, NO_ES_ALUMNO: 404 }, 409);
}

export async function registrarPago(req, res) {
  const { documento, tipo_plan_id, monto_pagado, metodo_pago } = req.datos.body;

  const resultado = await registrarPagoPorDni({
    documento,
    tipo_plan_id,
    monto_pagado,
    metodo_pago,
    usuario_id_cobro: req.user.usuario_id,
    modificado_por: req.user.usuario_id,
  });

  return responderResultado(res, resultado, { NO_EXISTE: 404, NO_ES_ALUMNO: 404, PLAN_NO_EXISTE: 404, VALIDACION: 400 }, 409);
}
