/**
 * Fecha de hoy en Argentina (AAAA-MM-DD). No usar new Date().toISOString(): da la fecha en UTC,
 * que desde las 21 h ya es "mañana".
 */
export function hoyISOArgentina() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
}

export function formatearFechaAR(fecha) {
  if (!fecha) return "";

  const texto = String(fecha).slice(0, 10);
  const [anio, mes, dia] = texto.split("-");

  if (!anio || !mes || !dia) return fecha;

  return `${dia}/${mes}/${anio}`;
}