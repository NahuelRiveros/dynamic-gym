import { actualizarEstadosAlumnosAutomatico } from "../services/estado_alumno_auto_service.js";
import {
  obtenerPlanVigentePorDni,
  actualizarPlanVigentePorDni,
  actualizarPersonaAlumnoPorDni,
} from "../services/admin_planes_alumno_service.js";
import { responderResultado } from "../nucleo/responder.js";

export async function ActualizarEstadosAutomatico(req, res) {
  const r = await actualizarEstadosAlumnosAutomatico({
    fuente: "ADMIN_PANEL",
    modificado_por: req.user.usuario_id,
    limit: 10000,
  });
  return res.json(r);
}

export async function buscarPlanVigenteAlumno(req, res) {
  const resultado = await obtenerPlanVigentePorDni({ documento: req.datos.query.documento });
  return responderResultado(res, resultado, { NO_EXISTE: 404, NO_ES_ALUMNO: 404 }, 409);
}

export async function actualizarPersonaAlumno(req, res) {
  const resultado = await actualizarPersonaAlumnoPorDni(req.datos.body);
  return responderResultado(res, resultado, { NO_EXISTE: 404, DOCUMENTO_DUPLICADO: 409, EMAIL_DUPLICADO: 409 });
}

export async function actualizarPlanVigenteAlumno(req, res) {
  const resultado = await actualizarPlanVigentePorDni({
    ...req.datos.body,
    modificado_por: req.user.usuario_id,
  });
  return responderResultado(res, resultado, { NO_EXISTE: 404, NO_ES_ALUMNO: 404, PLAN_NO_EXISTE: 404, VALIDACION: 400 }, 409);
}
