import { listarAlumnos } from "../services/lista_alumnos_service.js";
import { obtenerDetalleAlumno } from "../services/alumno_detalle_service.js";
import { obtenerAlumnosCumples } from "../services/alumno_cumples.js";
import { responderResultado } from "../nucleo/responder.js";

export async function listaAlumnos(req, res) {
  const r = await listarAlumnos(req.datos.query);
  return res.json(r);
}

export async function detalleAlumno(req, res) {
  const r = await obtenerDetalleAlumno({ alumno_id: req.datos.params.id });
  return responderResultado(res, r, { NO_EXISTE: 404 });
}

export async function alumnosCumples(req, res) {
  const { dias, incluirMes } = req.datos.query;
  const data = await obtenerAlumnosCumples({ dias, incluirMes });
  return res.json(data);
}
