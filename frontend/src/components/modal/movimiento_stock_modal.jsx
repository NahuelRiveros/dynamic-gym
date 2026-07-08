import { useEffect, useState } from "react";

const METODOS_PAGO = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "DÉBITO", label: "Débito" },
  { value: "CRÉDITO", label: "Crédito" },
  { value: "MERCADO PAGO", label: "Mercado Pago" },
];

const TITULOS = {
  entrada: "Reponer stock",
  venta: "Vender producto",
  baja: "Dar de baja",
};

const ETIQUETAS_BOTON = {
  entrada: "Reponer",
  venta: "Vender",
  baja: "Dar de baja",
};

export default function MovimientoStockModal({
  abierto,
  tipo, // "entrada" | "venta" | "baja"
  producto,
  onClose,
  onConfirmar,
  cargando = false,
}) {
  const [cantidad, setCantidad] = useState(1);
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setCantidad(1);
    setMetodoPago("EFECTIVO");
    setMotivo("");
    setError("");
  }, [abierto, tipo, producto]);

  if (!abierto || !producto) return null;

  async function submit(e) {
    e.preventDefault();

    const cant = Number(cantidad);
    if (!Number.isInteger(cant) || cant <= 0) {
      setError("La cantidad debe ser un entero mayor a 0");
      return;
    }
    if (tipo !== "entrada" && cant > producto.stock_actual) {
      setError(`Solo quedan ${producto.stock_actual} unidad(es) en stock`);
      return;
    }
    if (tipo === "baja" && !motivo.trim()) {
      setError("El motivo es obligatorio para dar de baja");
      return;
    }

    setError("");
    await onConfirmar({ cantidad: cant, metodo_pago: metodoPago, motivo: motivo.trim() });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="border-b px-6 py-4">
          <h2 className="text-xl font-semibold">{TITULOS[tipo]}</h2>
          <p className="mt-0.5 text-sm text-gray-500">{producto.nombre}</p>
        </div>

        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Cantidad {tipo !== "entrada" && `(disponible: ${producto.stock_actual})`}
            </label>
            <input
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
              min="1"
            />
          </div>

          {tipo === "venta" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Método de pago
              </label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
              >
                {METODOS_PAGO.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          )}

          {tipo === "baja" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Motivo
              </label>
              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
                placeholder="Ej: Rotura, vencimiento, consumo interno..."
              />
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm font-medium"
              disabled={cargando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              disabled={cargando}
            >
              {cargando ? "Guardando..." : ETIQUETAS_BOTON[tipo]}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
