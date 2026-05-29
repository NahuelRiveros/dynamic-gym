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
import { AlertTriangle, CreditCard, X, Lock } from "lucide-react";
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

  // ── Vencido: overlay bloqueante ───────────────────────────────────────────
  if (estado.estado === "vencido") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="mx-4 max-w-md rounded-2xl border border-red-500/30 bg-[#1a0a0a] p-8 text-center shadow-2xl shadow-red-500/20">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/30">
            <Lock size={32} className="text-red-400" />
          </div>
          <h2 className="mb-2 text-2xl font-extrabold text-white">Sistema bloqueado</h2>
          <p className="mb-1 text-sm text-red-300">{estado.mensaje}</p>
          <p className="mb-6 text-xs text-gray-500">
            El período de gracia de 10 días ha terminado.
          </p>
          <button
            onClick={() => navigate("/admin/suscripcion")}
            className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-6 py-3 font-bold text-white shadow-lg shadow-red-500/30 hover:bg-red-400 transition"
          >
            <CreditCard size={16} />
            Renovar plan ahora
          </button>
        </div>
      </div>
    );
  }

  // ── Aviso / Gracia: banner top ────────────────────────────────────────────
  if (cerrado) return null;

  const esGracia  = estado.estado === "gracia";
  const colorCls  = esGracia
    ? "bg-orange-500/10 border-orange-500/30 text-orange-300"
    : "bg-yellow-500/10 border-yellow-500/30 text-yellow-300";
  const iconColor = esGracia ? "text-orange-400" : "text-yellow-400";

  return (
    <div className={`w-full border-b px-4 py-2.5 ${colorCls}`}>
      <div className="mx-auto flex max-w-5xl items-center gap-3">
        <AlertTriangle size={15} className={`shrink-0 ${iconColor}`} />
        <p className="flex-1 text-xs font-medium">{estado.mensaje}</p>
        <button
          onClick={() => navigate("/admin/suscripcion")}
          className={`shrink-0 rounded-lg px-3 py-1 text-xs font-bold transition ${esGracia ? "bg-orange-500/20 hover:bg-orange-500/30 text-orange-300" : "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300"}`}
        >
          Renovar
        </button>
        <button onClick={() => setCerrado(true)} className="shrink-0 opacity-50 hover:opacity-100 transition">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
