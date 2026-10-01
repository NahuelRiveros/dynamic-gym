import { useQuery } from "@tanstack/react-query";
import { obtenerMovimientos } from "../../api/stock_api.js";
import Modal from "../ui/modal.jsx";

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
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(Number(precio || 0));
}

// Con TanStack Query: se pide al abrir y se vuelve a pedir cada vez que se abre (puede haber ventas nuevas).
function ListaMovimientos({ productoId }) {
  const { data: movimientos = [], isPending, isError, error, refetch } = useQuery({
    queryKey: ["stock", "movimientos", productoId],
    queryFn: async () => (await obtenerMovimientos(productoId)).data ?? [],
  });

  if (isPending) return <p className="py-10 text-center text-sm text-slate-400">Cargando…</p>;
  if (isError) {
    return (
      <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        {error?.response?.data?.mensaje || "No se pudo cargar el historial"}
        <button type="button" onClick={() => refetch()} className="rounded-lg border border-red-300 px-3 py-1 font-semibold hover:bg-red-100">Reintentar</button>
      </div>
    );
  }
  if (movimientos.length === 0) return <p className="py-10 text-center text-sm text-slate-400">Todavía no hay movimientos registrados.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs" aria-label="Movimientos">
        <thead>
          <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <th scope="col" className="px-2 py-2 text-left">Fecha y hora</th>
            <th scope="col" className="px-2 py-2 text-left">Tipo</th>
            <th scope="col" className="px-2 py-2 text-right">Cantidad</th>
            <th scope="col" className="px-2 py-2 text-left">Detalle</th>
            <th scope="col" className="px-2 py-2 text-left">Usuario</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {movimientos.map((m) => {
            const tipo = ETIQUETAS_TIPO[m.tipo] || { label: m.tipo, clase: "bg-slate-50 text-slate-600 border-slate-200" };
            return (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-2 py-2.5 text-slate-600">{formatearFecha(m.creado_en)}</td>
                <td className="px-2 py-2.5">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${tipo.clase}`}>{tipo.label}</span>
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
    </div>
  );
}

export default function HistorialStockModal({ abierto, producto, onClose }) {
  return (
    <Modal abierto={abierto && !!producto} onCerrar={onClose} titulo="Historial de movimientos" descripcion={producto?.nombre} ancho="2xl">
      <ListaMovimientos productoId={producto?.id} />
    </Modal>
  );
}
