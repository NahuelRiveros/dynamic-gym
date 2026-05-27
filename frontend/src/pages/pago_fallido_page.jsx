import { useNavigate } from "react-router-dom";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function PagoFallidoPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-5">

        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-red-100 shadow-lg shadow-red-200">
          <XCircle size={40} className="text-red-500" />
        </div>

        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Pago no completado</h1>
          <p className="mt-2 text-slate-500 text-sm">
            El pago fue cancelado o rechazado. Tu plan no fue modificado.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => navigate("/admin/suscripcion")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 transition"
          >
            <RefreshCw size={15} />
            Intentar de nuevo
          </button>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            <ArrowLeft size={15} />
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
