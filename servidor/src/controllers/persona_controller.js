import { registrarPersonaConAlumno } from "../services/persona_service.js";
import { responderResultado } from "../nucleo/responder.js";

export async function registrar(req, res) {
  const r = await registrarPersonaConAlumno(req.datos.body);
  return responderResultado(res, r, { DOCUMENTO_DUPLICADO: 409, EMAIL_DUPLICADO: 409, VALIDACION: 400 });
}
