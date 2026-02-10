// src/controllers/lista_alumnos_controller.js
import { listarAlumnos } from "../services/lista_alumnos_service.js";

function toInt(v, def) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : def;
}

export async function listaAlumnos(req, res, next) {
  try {
    const {
      q,
      dni,
      estado_id,
      plan_vigente,
      page,
      limit,
      sort,
      order,
    } = req.query;

    const filtros = {
      q: q ? String(q).trim() : null,
      dni: dni ? String(dni).trim() : null,
      estado_id: estado_id != null ? toInt(estado_id, null) : null,
      plan_vigente: plan_vigente != null ? String(plan_vigente) === "1" : null,
      page: Math.max(1, toInt(page, 1)),
      limit: Math.min(100, Math.max(1, toInt(limit, 20))),
      sort: sort ? String(sort) : "apellido",
      order: order && String(order).toLowerCase() === "asc" ? "asc" : "desc",
    };

    const r = await listarAlumnos(filtros);

    return res.json(r);
  } catch (err) {
    next(err);
  }
}
