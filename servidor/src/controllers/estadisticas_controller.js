import {
  obtenerAlumnosNuevos,
  obtenerVencimientos,
  obtenerAsistencias,
  obtenerAsistenciasHoras,
  obtenerAsistenciasHoraDiaSemana,
  obtenerPlanesPopulares,
} from "../services/estadisticas_service.js";

/**
 * Helpers
 */
function parseIntSafe(v, def) {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : def;
}

function rangoMesActualISO() {
  const hoy = new Date();
  const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);
  return { desde, hasta };
}

/**
 * =========================
 * 1) ALUMNOS NUEVOS
 * GET /estadisticas/alumnos_Nuevos?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 * Si no manda fechas, usa mes actual.
 * =========================
 */
export async function AlumnosNuevos(req, res) {
  try {
    const { desde: defDesde, hasta: defHasta } = rangoMesActualISO();

    const desde = req.query.desde ?? defDesde;
    const hasta = req.query.hasta ?? defHasta;

    const data = await obtenerAlumnosNuevos({ desde, hasta });

    return res.json({
      ok: true,
      desde,
      hasta,
      ...data,
    });
  } catch (error) {
    console.error("AlumnosNuevos:", error);
    return res.status(500).json({
      ok: false,
      codigo: "ERROR_ALUMNOS_NUEVOS",
      mensaje: "No se pudo obtener alumnos nuevos",
    });
  }
}

/**
 * =========================
 * 2) VENCIMIENTOS PRÓXIMOS
 * GET /estadisticas/vencimientos?dias=7
 * =========================
 */
export async function VencimientosProximos7Dias(req, res) {
  try {
    const dias = parseIntSafe(req.query.dias, 7);
    const data = await obtenerVencimientos({ dias });

    return res.json({
      ok: true,
      dias,
      ...data,
    });
  } catch (error) {
    console.error("VencimientosProximos7Dias:", error);
    return res.status(500).json({
      ok: false,
      codigo: "ERROR_VENCIMIENTOS",
      mensaje: "No se pudo obtener vencimientos próximos",
    });
  }
}

/**
 * =========================
 * 3) ASISTENCIAS (Resumen)
 * GET /estadisticas/asistencias?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 * Si no manda fechas, usa mes actual.
 * =========================
 */
export async function Asistencias(req, res) {
  try {
    const { desde: defDesde, hasta: defHasta } = rangoMesActualISO();

    const desde = req.query.desde ?? defDesde;
    const hasta = req.query.hasta ?? defHasta;

    const data = await obtenerAsistencias({ desde, hasta });

    return res.json({
      ok: true,
      desde,
      hasta,
      ...data,
    });
  } catch (error) {
    console.error("Asistencias:", error);
    return res.status(500).json({
      ok: false,
      codigo: "ERROR_ASISTENCIAS",
      mensaje: "No se pudo obtener asistencias",
    });
  }
}

/**
 * =========================
 * 4) ASISTENCIAS POR HORA
 * GET /estadisticas/asistencias_horas?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 * Si no manda fechas, usa mes actual.
 * =========================
 */
export async function AsistenciasHoras(req, res) {
  try {
    const { desde: defDesde, hasta: defHasta } = rangoMesActualISO();

    const desde = req.query.desde ?? defDesde;
    const hasta = req.query.hasta ?? defHasta;

    const data = await obtenerAsistenciasHoras({ desde, hasta });

    return res.json({
      ok: true,
      desde,
      hasta,
      ...data,
    });
  } catch (error) {
    console.error("AsistenciasHoras:", error);
    return res.status(500).json({
      ok: false,
      codigo: "ERROR_ASISTENCIAS_HORAS",
      mensaje: "No se pudo obtener la asistencia por hora",
    });
  }
}

/**
 * =========================
 * 5) PLANES MÁS POPULARES
 * GET /estadisticas/planes-populares?anio=2026
 * =========================
 */
export async function PlanesPopulares(req, res) {
  try {
    const anio = req.query.anio ?? new Date().getFullYear();
    const data = await obtenerPlanesPopulares({ anio });
    return res.json({ ok: true, anio: Number(anio), ...data });
  } catch (error) {
    console.error("PlanesPopulares:", error);
    return res.status(500).json({
      ok: false,
      codigo: "ERROR_PLANES_POPULARES",
      mensaje: "No se pudo obtener popularidad de planes",
    });
  }
}

/**
 * =========================
 * 6) ASISTENCIAS POR HORA Y DÍA (Heatmap)
 * GET /estadisticas/asistencias_horas_dia?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 * =========================
 */
export async function AsistenciasHorasDia(req, res) {
  try {
    const { desde: defDesde, hasta: defHasta } = rangoMesActualISO();

    const desde = req.query.desde ?? defDesde;
    const hasta = req.query.hasta ?? defHasta;

    const data = await obtenerAsistenciasHoraDiaSemana({ desde, hasta });

    return res.json({
      ok: true,
      desde,
      hasta,
      ...data,
      dias: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
    });
  } catch (error) {
    console.error("AsistenciasHorasDia:", error);
    return res.status(500).json({
      ok: false,
      codigo: "ERROR_ASISTENCIAS_HORAS_DIA",
      mensaje: "No se pudo obtener asistencias por hora y día",
    });
  }
}