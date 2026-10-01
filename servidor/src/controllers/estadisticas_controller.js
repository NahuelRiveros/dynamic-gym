import {
  obtenerAlumnosNuevos,
  obtenerVencimientos,
  obtenerAsistencias,
  obtenerAsistenciasHoras,
  obtenerAsistenciasHoraDiaSemana,
  obtenerPlanesPopulares,
} from "../services/estadisticas_service.js";

// Las fechas (desde/hasta, por defecto el mes actual) y los números llegan ya validados
// por estadisticas_router.js en req.datos.query.

/** GET /estadisticas/alumnos_Nuevos?desde=YYYY-MM-DD&hasta=YYYY-MM-DD */
export async function AlumnosNuevos(req, res) {
  const { desde, hasta } = req.datos.query;
  const data = await obtenerAlumnosNuevos({ desde, hasta });
  return res.json({ ok: true, desde, hasta, ...data });
}

/** GET /estadisticas/vencimientos?dias=7 */
export async function VencimientosProximos7Dias(req, res) {
  const { dias } = req.datos.query;
  const data = await obtenerVencimientos({ dias });
  return res.json({ ok: true, dias, ...data });
}

/** GET /estadisticas/asistencias?desde=YYYY-MM-DD&hasta=YYYY-MM-DD */
export async function Asistencias(req, res) {
  const { desde, hasta } = req.datos.query;
  const data = await obtenerAsistencias({ desde, hasta });
  return res.json({ ok: true, desde, hasta, ...data });
}

/** GET /estadisticas/asistencias_horas?desde=YYYY-MM-DD&hasta=YYYY-MM-DD */
export async function AsistenciasHoras(req, res) {
  const { desde, hasta } = req.datos.query;
  const data = await obtenerAsistenciasHoras({ desde, hasta });
  return res.json({ ok: true, desde, hasta, ...data });
}

/** GET /estadisticas/planes-populares?anio=2026 */
export async function PlanesPopulares(req, res) {
  const { anio } = req.datos.query;
  const data = await obtenerPlanesPopulares({ anio });
  return res.json({ ok: true, anio, ...data });
}

/** GET /estadisticas/asistencias_horas_dia?desde=YYYY-MM-DD&hasta=YYYY-MM-DD (heatmap) */
export async function AsistenciasHorasDia(req, res) {
  const { desde, hasta } = req.datos.query;
  const data = await obtenerAsistenciasHoraDiaSemana({ desde, hasta });
  return res.json({
    ok: true,
    desde,
    hasta,
    ...data,
    dias: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
  });
}
