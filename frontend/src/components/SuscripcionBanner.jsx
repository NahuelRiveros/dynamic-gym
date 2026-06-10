/**
 * SuscripcionBanner.jsx
 *
 * Banner global que aparece en la parte superior cuando el plan del software
 * está próximo a vencer o ya venció. Solo visible para admin.
 *
 * Estados:
 *   aviso   → amarillo  (últimos 10 días)
 *   gracia  → naranja   (del 1 al 10 del mes siguiente)
 *   vencido → rojo      (bloqueo suave — overlay completo)
 */

import { useEffect, useState } from "react";
import { AlertTriangle, CreditCard, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/auth_context";
import { getEstadoSuscripcion } from "../api/suscripcion_api";

export default function SuscripcionBanner() {
  const { usuario, isAuth } = useAuth();
  const navigate            = useNavigate();
  const [estado, setEstado] = useState(null);
  const [cerrado, setCerrado] = useState(false);

  const esAdmin = isAuth && usuario?.roles?.includes("admin");

  useEffect(() => {
    if (!esAdmin) return;

    function verificar() {
      getEstadoSuscripcion()
        .then((r) => {
          if (r.ok && ["aviso", "gracia", "vencido"].includes(r.estado)) {
            setEstado(r);
          } else {
            setEstado(null); // limpiar si el estado mejoró (ej: Nahuel renovó)
          }
        })
        .catch(() => {});
    }

    verificar();
    // Re-verificar cada 15 minutos para tabs abiertos largo tiempo
    const intervalo = setInterval(verificar, 15 * 60 * 1000);
    return () => clearInterval(intervalo);
  }, [esAdmin]);

  if (!esAdmin || !estado) return null;

  // Vencido: banner rojo persistente (no se puede cerrar, pero no bloquea la pantalla)
  // El backend ya bloquea las escrituras — acá solo avisamos
  const esVencido = estado.estado === "vencido";
  const esGracia  = estado.estado === "gracia";

  const cfg = {
    vencido: {
      bar:    "bg-red-500/10 border-red-500/30 text-red-300",
      icon:   "text-red-400",
      btn:    "bg-red-500/20 hover:bg-red-500/30 text-red-300",
    },
    gracia: {
      bar:    "bg-blue-500/10 border-blue-500/30 text-blue-300",
      icon:   "text-blue-400",
      btn:    "bg-blue-500/20 hover:bg-blue-500/30 text-blue-300",
    },
    aviso: {
      bar:    "bg-yellow-500/10 border-yellow-500/30 text-yellow-300",
      icon:   "text-yellow-400",
      btn:    "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300",
    },
  }[estado.estado] ?? {};

  // Aviso y gracia son descartables; vencido no (el backend rechaza escrituras)
  if (!esVencido && cerrado) return null;

  return (
    <div className={`w-full border-b px-4 py-2.5 ${cfg.bar}`}>
      <div className="mx-auto flex max-w-5xl items-center gap-3">
        <AlertTriangle size={15} className={`shrink-0 ${cfg.icon}`} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{estado.mensaje}</p>
          {esVencido && (
            <p className="text-[11px] opacity-60 mt-0.5">
              Podés consultar datos pero no registrar nuevos hasta renovar.
            </p>
          )}
        </div>
        <button
          onClick={() => navigate("/admin/suscripcion")}
          className={`shrink-0 rounded-lg px-3 py-1 text-xs font-bold transition ${cfg.btn}`}
        >
          <span className="flex items-center gap-1.5">
            <CreditCard size={11} /> Renovar
          </span>
        </button>
        {!esVencido && (
          <button onClick={() => setCerrado(true)} className="shrink-0 opacity-50 hover:opacity-100 transition">
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
