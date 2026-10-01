import {
  listarStaff,
  crearStaff,
  actualizarStaff,
  cambiarPasswordStaff,
  cambiarEstadoStaff,
} from "../services/admin_staff_services.js";
import { responderResultado } from "../nucleo/responder.js";

export async function listarStaffController(_req, res) {
  const data = await listarStaff();
  return res.json({ ok: true, data });
}

export async function crearStaffController(req, res) {
  const { email, password, nombre, apellido, documento } = req.body ?? {};
  const result = await crearStaff({ email, password, nombre, apellido, documento });
  return result.ok ? res.status(201).json(result) : res.status(400).json(result);
}

export async function actualizarStaffController(req, res) {
  const { nombre, apellido, email, documento } = req.body ?? {};
  const result = await actualizarStaff(req.datos.params.usuarioId, { nombre, apellido, email, documento });
  return responderResultado(res, result, { NO_ENCONTRADO: 404 });
}

export async function cambiarPasswordStaffController(req, res) {
  const { password } = req.body ?? {};
  const result = await cambiarPasswordStaff(req.datos.params.usuarioId, password);
  return responderResultado(res, result, { NO_ENCONTRADO: 404 });
}

export async function cambiarEstadoStaffController(req, res) {
  const result = await cambiarEstadoStaff(req.datos.params.usuarioId, req.datos.body.activo);
  return responderResultado(res, result, {}, 404);
}
