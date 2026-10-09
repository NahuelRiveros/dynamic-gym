import { formatearFechaAR } from "../../components/form/formatear_fecha";
import { situacionDelPlan } from "../../lib/situacion_plan.js";

export const fechaCorta = (valor) => (valor ? formatearFechaAR(String(valor).slice(0, 10)) || "—" : "—");

/**
 * Qué le decimos al alumno sobre su plan: si puede entrar hoy y, si no, qué tiene que hacer.
 * La situación (al día, vence pronto, vencido...) es la misma que ve el staff en la lista.
 */
export function estadoDelPlan(plan) {
  const situacion = situacionDelPlan(plan);
  const mensajes = {
    sin_plan: { titulo: "Todavía no tenés un plan", detalle: "Acercate a recepción y elegí el que mejor se adapte a vos." },
    vencido: { titulo: "Tu plan está vencido", detalle: `Venció el ${fechaCorta(plan?.fin)}. Renovalo en recepción y volvé a entrenar.` },
    sin_ingresos: { titulo: "Usaste todos tus ingresos", detalle: "Renová tu plan en recepción para seguir entrenando." },
    por_vencer: { titulo: `Tu plan ${situacion.etiqueta.toLowerCase()}`, detalle: "Renovalo en recepción para no cortar tu entrenamiento." },
    al_dia: { titulo: "¡Tu plan está al día!", detalle: "Te esperamos para entrenar." },
  };
  return { tono: situacion.tono, ...mensajes[situacion.clave] };
}

/** Cuánto del plan queda (0 a 1), para la barra de la tarjeta. */
export function proporcionRestante(plan) {
  if (!plan?.inicio || !plan?.fin || !plan.vigente_hoy) return 0;
  const total = (Date.parse(plan.fin) - Date.parse(plan.inicio)) / 864e5;
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, (Number(plan.dias_restantes) + 1) / (total + 1)));
}
