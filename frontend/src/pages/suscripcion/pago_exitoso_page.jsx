import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Clock, ArrowLeft } from "lucide-react";

export default function PagoExitosoPage() {
  const [params]  = useSearchParams();
  const navigate  = useNavigate();
  const pendiente = params.get("pending") === "1";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-5">

        <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-2xl shadow-lg ${
          pendiente
            ? "bg-yellow-100 shadow-yellow-200"
            : "bg-emerald-100 shadow-emerald-200"
        }`}>
          {pendiente
            ? <Clock size={40} className="text-yellow-500" />
            : <CheckCircle2 size={40} className="text-emerald-500" />
          }
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {pendiente ? "Pago pendiente" : "¡Pago recibido!"}
          </h1>
          <p className="mt-2 text-slate-500 text-sm">
            {pendiente
              ? "Tu pago está siendo procesado. El plan se actualizará automáticamente cuando se confirme."
              : "Tu plan fue renovado correctamente. El sistema ya está activo."
            }
          </p>
        </div>

        {!pendiente && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700 font-medium">
            La suscripción se extendió 30 días automáticamente.
          </div>
        )}

        <button
          onClick={() => navigate("/admin/suscripcion")}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 transition"
        >
          <ArrowLeft size={15} />
          Ver mi plan
        </button>
      </div>
    </div>
  );
}
