import { registrarIngresoPorDni } from "../services/ingresos_service.js";
import { responderResultado } from "../nucleo/responder.js";

export async function registrarIngreso(req, res) {
  const r = await registrarIngresoPorDni({ dni: req.datos.body.dni });

  return responderResultado(res, r, {
    NO_EXISTE: 404,
    NO_ES_ALUMNO: 404,
    PLAN_VENCIDO_O_INEXISTENTE: 409,
    SIN_INGRESOS: 409,
    YA_INGRESO_HOY: 409,
  });
}
