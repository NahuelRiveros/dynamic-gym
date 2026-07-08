import { useState } from "react";
import MovimientoStockModal from "../../components/modal/movimiento_stock_modal";
import DataGrid from "../../components/table/DataGrid";
import { registrarEntrada, registrarVenta } from "../../api/stock_api.js";
import { PackagePlus, ShoppingCart } from "lucide-react";

function formatearPrecio(precio) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency", currency: "ARS", minimumFractionDigits: 0,
  }).format(Number(precio || 0));
}

function iniciales(nombre) {
  return String(nombre || "")
    .split(" ").filter(Boolean).slice(0, 2)
    .map((w) => w[0].toUpperCase()).join("") || "P";
}

export default function VenderTab({ productos, cargando, onRefrescar }) {
  const [movimiento, setMovimiento] = useState(null); // { tipo, producto }
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const disponibles = productos.filter((p) => p.activo && p.stock_actual > 0);

  function abrirMovimiento(tipo, producto) { setMovimiento({ tipo, producto }); }
  function cerrarMovimiento() { setMovimiento(null); }

  async function confirmarMovimiento({ cantidad, metodo_pago }) {
    try {
      setGuardando(true);
      const { tipo, producto } = movimiento;
      if (tipo === "entrada") await registrarEntrada(producto.id, { cantidad });
      if (tipo === "venta") await registrarVenta(producto.id, { cantidad, metodo_pago });
      cerrarMovimiento();
      await onRefrescar();
    } catch (err) {
      setError(err?.response?.data?.mensaje || "No se pudo registrar el movimiento");
    } finally {
      setGuardando(false);
    }
  }

  const columns = [
    {
      key: "nombre",
      label: "Producto",
      sortable: true,
      searchable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-[10px] font-extrabold text-white shadow-sm shadow-blue-500/30">
            {iniciales(row.nombre)}
          </div>
          <div>
            <span className="font-semibold text-slate-900">{row.nombre}</span>
            {row.categoria?.descripcion && (
              <span className="block text-[11px] text-slate-400">{row.categoria.descripcion}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "precio_venta",
      label: "Precio",
      sortable: true,
      render: (_, val) => <span className="font-bold text-blue-700">{formatearPrecio(val)}</span>,
    },
    {
      key: "stock_actual",
      label: "Stock",
      sortable: true,
      align: "center",
      headerClassName: "text-center",
      render: (row) => (
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
          {row.stock_actual}
        </span>
      ),
    },
  ];

  const actions = [
    {
      key: "vender",
      label: "Vender",
      icon: <ShoppingCart size={12} />,
      variant: "primary",
      onClick: (row) => abrirMovimiento("venta", row),
    },
    {
      key: "reponer",
      label: "Reponer",
      icon: <PackagePlus size={12} />,
      variant: "success",
      onClick: (row) => abrirMovimiento("entrada", row),
    },
  ];

  return (
    <>
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">{error}</div>
      )}

      <DataGrid
        rows={disponibles}
        columns={columns}
        keyField="id"
        loading={cargando}
        searchable
        searchPlaceholder="Buscar producto…"
        emptyMessage="No hay productos disponibles para vender."
        actions={actions}
        actionsLabel="Acciones"
        actionsPosition="end"
        pageSize={15}
        pageSizeOptions={[10, 15, 25]}
      />

      <MovimientoStockModal
        abierto={Boolean(movimiento)}
        tipo={movimiento?.tipo}
        producto={movimiento?.producto}
        onClose={cerrarMovimiento}
        onConfirmar={confirmarMovimiento}
        cargando={guardando}
      />
    </>
  );
}
