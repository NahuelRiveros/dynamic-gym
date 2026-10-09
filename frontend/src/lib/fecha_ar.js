const ZONA_AR = "America/Argentina/Buenos_Aires";

/** Hoy en Argentina: { anio, mes, dia } (el navegador o el servidor pueden estar en otra zona). */
export function hoyAR() {
  const [anio, mes, dia] = new Date().toLocaleDateString("en-CA", { timeZone: ZONA_AR }).split("-").map(Number);
  return { anio, mes, dia };
}

/** Años cumplidos a hoy (Argentina) desde una fecha "AAAA-MM-DD"; null si no hay fecha. */
export function edad(fechaNacimiento, hoy = hoyAR()) {
  if (!fechaNacimiento) return null;
  const [anio, mes, dia] = String(fechaNacimiento).slice(0, 10).split("-").map(Number);
  if (!anio) return null;
  const yaCumplio = hoy.mes > mes || (hoy.mes === mes && hoy.dia >= dia);
  return hoy.anio - anio - (yaCumplio ? 0 : 1);
}

const relativo = new Intl.RelativeTimeFormat("es-AR", { numeric: "auto" });
const PASOS = [
  { unidad: "year", segundos: 365 * 86400 },
  { unidad: "month", segundos: 30 * 86400 },
  { unidad: "day", segundos: 86400 },
  { unidad: "hour", segundos: 3600 },
  { unidad: "minute", segundos: 60 },
];

/** "hace 5 minutos", "ayer", "hace 3 meses"; null si no hay fecha. Para lo que pasó, no fechas futuras. */
export function haceCuanto(fecha, ahora = new Date()) {
  if (!fecha) return null;
  const segundos = (new Date(fecha).getTime() - ahora.getTime()) / 1000;
  if (Number.isNaN(segundos)) return null;
  const paso = PASOS.find((p) => Math.abs(segundos) >= p.segundos);
  return paso ? relativo.format(Math.round(segundos / paso.segundos), paso.unidad) : "recién";
}

/**
 * "AAAA-MM-DD" del último día de un plan de `dias` días que empieza hoy (Argentina): el día de
 * hoy cuenta, igual que en el servidor (pagos_service). null si el plan no tiene días.
 */
export function vencimientoDesdeHoy(dias, hoy = hoyAR()) {
  if (!Number(dias) || dias <= 0) return null;
  return new Date(Date.UTC(hoy.anio, hoy.mes - 1, hoy.dia + Number(dias) - 1)).toISOString().slice(0, 10);
}
