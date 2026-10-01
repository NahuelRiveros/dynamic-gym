import {
  listarPlanes,
  obtenerPlanPorId,
  crearPlan,
  actualizarPlan,
  existePlanConDescripcion,
  planEstaUsado,
  cambiarEstadoPlan,
} from "../services/planes_services.js";
import { validarPlanBody } from "../validator/planes_validators.js";

const NO_ENCONTRADO = { ok: false, mensaje: "Plan no encontrado" };

export async function listarPlanesController(req, res) {
  const incluirInactivos = req.query.incluirInactivos !== "false";
  const planes = await listarPlanes({ incluirInactivos });
  return res.json({ ok: true, data: planes });
}

export async function obtenerPlanPorIdController(req, res) {
  const plan = await obtenerPlanPorId(req.datos.params.id);
  if (!plan) return res.status(404).json(NO_ENCONTRADO);
  return res.json({ ok: true, data: plan });
}

export async function crearPlanController(req, res) {
  // validarPlanBody responde `errores` por campo: el formulario de planes los muestra así.
  const validacion = validarPlanBody(req.body);
  if (!validacion.esValido) {
    return res.status(400).json({ ok: false, mensaje: "Datos inválidos", errores: validacion.errores });
  }

  if (await existePlanConDescripcion(validacion.valores.descripcion)) {
    return res.status(409).json({ ok: false, mensaje: "Ya existe un plan con esa descripción" });
  }

  const nuevoPlan = await crearPlan(validacion.valores);
  return res.status(201).json({ ok: true, mensaje: "Plan creado correctamente", data: nuevoPlan });
}

export async function actualizarPlanController(req, res) {
  const { id } = req.datos.params;

  const validacion = validarPlanBody(req.body);
  if (!validacion.esValido) {
    return res.status(400).json({ ok: false, mensaje: "Datos inválidos", errores: validacion.errores });
  }

  if (!(await obtenerPlanPorId(id))) return res.status(404).json(NO_ENCONTRADO);

  if (await existePlanConDescripcion(validacion.valores.descripcion, id)) {
    return res.status(409).json({ ok: false, mensaje: "Ya existe otro plan con esa descripción" });
  }

  const planActualizado = await actualizarPlan(id, validacion.valores);
  return res.json({ ok: true, mensaje: "Plan actualizado correctamente", data: planActualizado });
}

export async function cambiarEstadoPlanController(req, res) {
  const { id } = req.datos.params;
  const { activo } = req.datos.body;

  if (!(await obtenerPlanPorId(id))) return res.status(404).json(NO_ENCONTRADO);

  // Un plan con pagos nunca se borra: se desactiva (el mensaje lo aclara).
  const usado = activo === false && (await planEstaUsado(id));
  const actualizado = await cambiarEstadoPlan(id, activo);

  const mensaje = usado
    ? "El plan está en uso, por eso se desactivó en lugar de borrarse"
    : activo ? "Plan activado correctamente" : "Plan desactivado correctamente";

  return res.json({ ok: true, mensaje, data: actualizado });
}
