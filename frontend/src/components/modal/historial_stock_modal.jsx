import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { obtenerMovimientos } from "../../api/stock_api.js";

const ETIQUETAS_TIPO = {
  entrada: { label: "Reposición", clase: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  venta:   { label: "Venta",      clase: "bg-blue-50 text-blue-700 border-blue-200" },
  baja:    { label: "Baja",       clase: "bg-amber-50 text-amber-700 border-amber-200" },
};

function formatearFecha(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Cordoba",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

function formatearPrecio(precio) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency", currency: "ARS", minimumFractionDigits: 0,
  }).format(Number(precio || 0));
}

export default function HistorialStockModal({ abierto, producto, onClose }) {
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!abierto || !producto) return;

    let cancelado = false;

    async function cargar() {
      try {
        setCargando(true);
        setError("");
        const resp = await obtenerMovimientos(producto.id);
        if (!cancelado) setMovimientos(resp.data || []);
      } catch (err) {
        if (!cancelado) setError(err?.response?.data?.mensaje || "No se pudo cargar el historial");
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargar();
    return () => { cancelado = true; };
  }, [abierto, producto]);

  if (!abierto || !producto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[85vh] rounded-2xl bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold">Historial de movimientos</h2>
            <p className="mt-0.5 text-sm text-gray-500">{producto.nombre}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-4">
          {cargando ? (
            <div className="py-10 text-center text-sm text-slate-400">Cargando…</div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          ) : movimientos.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">Todavía no hay movimientos registrados.</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-2 py-2 text-left">Fecha y hora</th>
                  <th className="px-2 py-2 text-left">Tipo</th>
                  <th className="px-2 py-2 text-right">Cantidad</th>
                  <th className="px-2 py-2 text-left">Detalle</th>
                  <th className="px-2 py-2 text-left">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {movimientos.map((m) => {
                  const tipo = ETIQUETAS_TIPO[m.tipo] || { label: m.tipo, clase: "bg-slate-50 text-slate-600 border-slate-200" };
                  return (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-2 py-2.5 text-slate-600 whitespace-nowrap">{formatearFecha(m.creado_en)}</td>
                      <td className="px-2 py-2.5">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${tipo.clase}`}>
                          {tipo.label}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-right font-bold text-slate-800">{m.cantidad}</td>
                      <td className="px-2 py-2.5 text-slate-600">
                        {m.tipo === "venta" && (
                          <>
                            {formatearPrecio(m.precio_unitario * m.cantidad)}
                            {m.metodo_pago && <span className="text-slate-400"> · {m.metodo_pago}</span>}
                          </>
                        )}
                        {m.tipo === "baja" && (m.motivo || "—")}
                        {m.tipo === "entrada" && "—"}
                      </td>
                      <td className="px-2 py-2.5 font-semibold text-slate-700">{m.usuario}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
