import {
  obtenerRecaudacionMensual,
  obtenerAlumnosNuevos,
  obtenerVencimientosProximos,
  obtenerAsistencias,
  obtenerAsistenciasPorHora,
  obtenerAsistenciasHoraDiaSemana,
  obtenerRecaudacionDiariaMes,
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
 * 1) RECAUDACIÓN MENSUAL
 * GET /estadisticas/Recaudaciones?anio=2026
 * =========================
 */
export async function RecaudacionMensual(req, res) {
  try {
    const anio = parseIntSafe(req.query.anio, new Date().getFullYear());
    const data = await obtenerRecaudacionMensual({ anio });

    return res.json({
      ok: true,
      anio,
      ...data, // { items }
    });
  } catch (error) {
    console.error("RecaudacionMensual:", error);
    return res.status(500).json({
      ok: false,
      codigo: "ERROR_RECAUDACION_MENSUAL",
      mensaje: "No se pudo obtener la recaudación mensual",
    });
  }
}



/**
 * =========================
 * 2) ALUMNOS NUEVOS
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
      ...data, // { total }
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
 * 3) VENCIMIENTOS PRÓXIMOS
 * GET /estadisticas/vencimientos?dias=7
 * =========================
 */
export async function VencimientosProximos7Dias(req, res) {
  try {
    const dias = parseIntSafe(req.query.dias, 7);
    const data = await obtenerVencimientosProximos({ dias });

    return res.json({
      ok: true,
      dias,
      ...data, // { total, items }
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
 * 4) ASISTENCIAS (Resumen)
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
      ...data, // { total_ingresos, ingresos_por_dia, top_alumnos }
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
 * 5) ASISTENCIAS POR HORA (Hora pico)
 * GET /estadisticas/asistencias_horas?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 * Si no manda fechas, usa mes actual.
 * =========================
 */
export async function AsistenciasHoras(req, res) {
  try {
    const { desde: defDesde, hasta: defHasta } = rangoMesActualISO();

    const desde = req.query.desde ?? defDesde;
    const hasta = req.query.hasta ?? defHasta;

    const data = await obtenerAsistenciasPorHora({ desde, hasta });

    return res.json({
      ok: true,
      desde,
      hasta,
      ...data, // { items, hora_pico, cantidad_pico }
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
 * 6) ASISTENCIAS POR HORA Y DÍA (Heatmap)
 * GET /estadisticas/asistencias_horas_dia?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 * Si no manda fechas, usa mes actual.
 *
 * Devuelve:
 * items: [{ dow, hora, cantidad }]
 * pico: { dow, hora, cantidad }
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
      ...data, // { items, pico }
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


/**
 * =========================
 * 5) Recaudacion diaria de un mes
 * GET /estadisticas/recaudaciones_diaria?anio=2022%mes=1
 * =========================
 */


export async function RecaudacionDiariaMes(req, res) {
  try {
    const anio = Number(req.query.anio);
    const mes = Number(req.query.mes); // 1..12

    if (!anio || !mes || mes < 1 || mes > 12) {
      return res.status(400).json({
        ok: false,
        codigo: "VALIDACION",
        mensaje: "anio y mes son obligatorios (mes 1..12)",
      });
    }

    const data = await obtenerRecaudacionDiariaMes({ anio, mes });

    return res.json({
      ok: true,
      anio,
      mes,
      ...data, // { items: [{dia,total}] }
    });
  } catch (e) {
    console.error("RecaudacionDiariaMes:", e);
    return res.status(500).json({
      ok: false,
      codigo: "ERROR_RECAUDACION_DIARIA",
      mensaje: "No se pudo obtener la recaudación diaria",
    });
  }
}
