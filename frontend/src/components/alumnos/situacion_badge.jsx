import { AlertTriangle, CalendarClock, CheckCircle2, MinusCircle, XCircle } from "lucide-react";
import { cn } from "../../lib/cn.js";

// Cada situación con ícono + texto: nunca solo el color.
const TONOS = {
  ok:      { icono: CheckCircle2,  clase: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  aviso:   { icono: CalendarClock, clase: "border-amber-200 bg-amber-50 text-amber-800" },
  alerta:  { icono: AlertTriangle, clase: "border-orange-200 bg-orange-50 text-orange-800" },
  vencido: { icono: XCircle,       clase: "border-rose-200 bg-rose-50 text-rose-700" },
  neutro:  { icono: MinusCircle,   clase: "border-slate-200 bg-slate-50 text-slate-600" },
};

/** Etiqueta de la situación del plan (de situacionDelPlan): "Al día", "Vence en 3 días", "Vencido"... */
export default function SituacionBadge({ situacion, grande = false }) {
  const { icono: Icono, clase } = TONOS[situacion.tono] ?? TONOS.neutro;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border font-semibold whitespace-nowrap", grande ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs", clase)}>
      <Icono aria-hidden="true" className={grande ? "h-4 w-4" : "h-3.5 w-3.5"} />
      {situacion.etiqueta}
    </span>
  );
}
