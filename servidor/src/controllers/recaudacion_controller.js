import {
  obtenerRecaudacionMesesPorAnio,
  obtenerRecaudacionDiasDeMes,
  obtenerDetalleRecaudacionDia,
} from "../services/recaudacion_service.js";

/** GET /recaudacion/mensual?anio=2026 */
export async function RecaudacionMesesPorAnio(req, res) {
  const { anio } = req.datos.query;
  const data = await obtenerRecaudacionMesesPorAnio({ anio });
  return res.json({ ok: true, anio, ...data });
}

/** GET /recaudacion/dias?anio=2026&mes=3 */
export async function RecaudacionDiasDeMes(req, res) {
  const { anio, mes } = req.datos.query;
  const data = await obtenerRecaudacionDiasDeMes({ anio, mes });
  return res.json({ ok: true, anio, mes, ...data });
}

/** GET /recaudacion/detalle-dia?anio=2026&mes=3&dia=20 */
export async function RecaudacionDetalleDia(req, res) {
  const { anio, mes, dia } = req.datos.query;
  const data = await obtenerDetalleRecaudacionDia({ anio, mes, dia });
  return res.json({ ok: true, anio, mes, dia, ...data });
}
