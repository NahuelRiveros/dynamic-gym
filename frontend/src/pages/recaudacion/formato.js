export const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
export const MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// Colores de la guía de gráficos (paleta validada para daltonismo): cada origen siempre el mismo.
export const COLOR = { planes: "#2a78d6", productos: "#eb6834" };

export { hoyAR } from "../../lib/fecha_ar.js";
export { nombreMetodo, plata, plataCorta } from "../../lib/dinero.js";

/** Variación porcentual redondeada; null si no hay con qué comparar. */
export function variacion(actual, anterior) {
  if (!anterior) return null;
  return Math.round(((actual - anterior) / anterior) * 100);
}
