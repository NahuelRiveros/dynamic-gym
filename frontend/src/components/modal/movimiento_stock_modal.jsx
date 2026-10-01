import { useState } from "react";
import Modal from "../ui/modal.jsx";
import BotonesModal from "../ui/botones_modal.jsx";
import ListaErrores from "../ui/lista_errores.jsx";

const CAMPO = "w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25";

const METODOS_PAGO = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "DÉBITO", label: "Débito" },
  { value: "CRÉDITO", label: "Crédito" },
  { value: "MERCADO PAGO", label: "Mercado Pago" },
];

const TITULOS = { entrada: "Reponer stock", venta: "Vender producto", baja: "Dar de baja" };
const ETIQUETAS_BOTON = { entrada: "Reponer", venta: "Vender", baja: "Dar de baja" };

// Se monta cada vez que se abre el modal: arranca siempre en 1 unidad, efectivo y sin motivo.
function FormularioMovimiento({ tipo, producto, onConfirmar, onClose, cargando }) {
  const [cantidad, setCantidad] = useState(1);
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();

    const cant = Number(cantidad);
    if (!Number.isInteger(cant) || cant <= 0) return setError("La cantidad debe ser un entero mayor a 0");
    if (tipo !== "entrada" && cant > producto.stock_actual) return setError(`Solo quedan ${producto.stock_actual} unidad(es) en stock`);
    if (tipo === "baja" && !motivo.trim()) return setError("El motivo es obligatorio para dar de baja");

    setError("");
    await onConfirmar({ cantidad: cant, metodo_pago: metodoPago, motivo: motivo.trim() });
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <label className="block text-sm font-medium text-slate-700">
        <span className="mb-1 block">Cantidad {tipo !== "entrada" && `(disponible: ${producto.stock_actual})`}</span>
        <input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} className={CAMPO} min="1" />
      </label>

      {tipo === "venta" && (
        <label className="block text-sm font-medium text-slate-700">
          <span className="mb-1 block">Método de pago</span>
          <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} className={CAMPO}>
            {METODOS_PAGO.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </label>
      )}

      {tipo === "baja" && (
        <label className="block text-sm font-medium text-slate-700">
          <span className="mb-1 block">Motivo</span>
          <input type="text" value={motivo} onChange={(e) => setMotivo(e.target.value)} className={CAMPO} placeholder="Ej: Rotura, vencimiento, consumo interno..." />
        </label>
      )}

      <ListaErrores errores={error ? [error] : []} />
      <BotonesModal onCancelar={onClose} ocupado={cargando} textoConfirmar={ETIQUETAS_BOTON[tipo]} peligro={tipo === "baja"} />
    </form>
  );
}

export default function MovimientoStockModal({ abierto, tipo, producto, onClose, onConfirmar, cargando = false }) {
  return (
    <Modal abierto={abierto && !!producto} onCerrar={onClose} titulo={TITULOS[tipo]} descripcion={producto?.nombre} ocupado={cargando} ancho="md">
      <FormularioMovimiento tipo={tipo} producto={producto} onConfirmar={onConfirmar} onClose={onClose} cargando={cargando} />
    </Modal>
  );
}
