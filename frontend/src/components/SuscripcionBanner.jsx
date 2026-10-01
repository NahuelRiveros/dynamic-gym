import { useEffect, useState } from "react";
import { AlertTriangle, CreditCard, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/auth_context";
import { useEstadoSuscripcion } from "../hook/use_suscripcion.js";

const DURACION_MS = 5000;
const ESTADOS_CON_AVISO = ["aviso", "gracia", "vencido"];

/** Aviso al admin cuando la suscripción está por vencer o vencida. Se cierra solo a los 5 s. */
export default function SuscripcionBanner() {
  const { usuario, isAuth } = useAuth();
  const esAdmin = isAuth && usuario?.roles?.includes("admin");
  const { data: estado } = useEstadoSuscripcion({ enabled: esAdmin });

  if (!esAdmin || !estado?.ok || !ESTADOS_CON_AVISO.includes(estado.estado)) return null;
  // `key`: si el estado cambia (ej. de "aviso" a "vencido"), el aviso vuelve a aparecer.
  return <AvisoSuscripcion key={estado.estado} mensaje={estado.mensaje} />;
}

function AvisoSuscripcion({ mensaje }) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const [progreso, setProgreso] = useState(100); // 100 → 0 en DURACION_MS

  // Auto-cierre a los 5 segundos + barra de progreso
  useEffect(() => {
    if (!visible) return;
    const inicio = Date.now();
    const tick = setInterval(() => {
      const restante = Math.max(0, 100 - ((Date.now() - inicio) / DURACION_MS) * 100);
      setProgreso(restante);
      if (restante === 0) {
        clearInterval(tick);
        setVisible(false);
      }
    }, 50);
    return () => clearInterval(tick);
  }, [visible]);

  if (!visible) return null;

  return (
    <div role="status" className="w-full bg-blue-600 text-white shadow-md relative overflow-hidden">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
        <AlertTriangle size={15} className="shrink-0 text-blue-200" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate">{mensaje}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/admin/suscripcion")}
          className="shrink-0 rounded-lg bg-white/20 hover:bg-white/30 px-3 py-1 text-xs font-bold transition"
        >
          <span className="flex items-center gap-1.5">
            <CreditCard size={11} aria-hidden="true" /> Renovar
          </span>
        </button>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Cerrar aviso"
          className="shrink-0 opacity-60 hover:opacity-100 transition"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>

      {/* Barra de progreso que se consume en 5s */}
      <div className="absolute bottom-0 left-0 h-0.5 bg-white/40" style={{ width: `${progreso}%` }} />
    </div>
  );
}
