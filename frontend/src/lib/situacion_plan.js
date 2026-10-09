// A partir de cuántos días antes del vencimiento se avisa "vence pronto".
export const DIAS_AVISO = 5;

/**
 * La situación del plan de un alumno, con las mismas reglas en Mi Plan, la lista y la ficha.
 * `plan`: { vigente_hoy, ingresos_disponibles, ingresos_ilimitados, dias_restantes } o null.
 * Orden de prioridad: lo que le impide entrar hoy va primero (vencido, sin ingresos).
 */
export function situacionDelPlan(plan) {
  if (!plan) return { clave: "sin_plan", tono: "neutro", etiqueta: "Sin plan" };
  if (!plan.vigente_hoy) return { clave: "vencido", tono: "vencido", etiqueta: "Vencido" };
  if (!plan.ingresos_ilimitados && Number(plan.ingresos_disponibles ?? 0) <= 0) {
    return { clave: "sin_ingresos", tono: "alerta", etiqueta: "Sin ingresos" };
  }
  const dias = Number(plan.dias_restantes);
  if (dias <= DIAS_AVISO) {
    const etiqueta = dias <= 0 ? "Vence hoy" : dias === 1 ? "Vence mañana" : `Vence en ${dias} días`;
    return { clave: "por_vencer", tono: "aviso", etiqueta, dias };
  }
  return { clave: "al_dia", tono: "ok", etiqueta: "Al día" };
}

/** Ingresos para mostrar: "Libre" en un plan ilimitado y "—" si el plan ya no sirve para entrar. */
export function ingresosParaMostrar(plan) {
  if (!plan || !plan.vigente_hoy) return "—";
  return plan.ingresos_ilimitados ? "Libre" : String(plan.ingresos_disponibles ?? 0);
}
