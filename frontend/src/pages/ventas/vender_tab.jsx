import { useState } from "react";
import MovimientoStockModal from "../../components/modal/movimiento_stock_modal";
import DataGrid from "../../components/ui/data_grid/data_grid.jsx";
import { mensajeDeError } from "../../hook/consultas_utils.js";
import { useMovimientoStock } from "../../hook/use_stock.js";
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

export default function VenderTab({ productos, cargando }) {
  const [movimiento, setMovimiento] = useState(null); // { tipo, producto }
  const registrar = useMovimientoStock();

  const disponibles = productos.filter((p) => p.activo && p.stock_actual > 0);

  function abrirMovimiento(tipo, producto) { registrar.reset(); setMovimiento({ tipo, producto }); }
  function cerrarMovimiento() { setMovimiento(null); }

  // Si falla (ej. alguien vendió la última unidad recién), el error se ve dentro del modal.
  async function confirmarMovimiento({ cantidad, metodo_pago }) {
    const { tipo, producto } = movimiento;
    await registrar.mutateAsync({ tipo, id: producto.id, cantidad, metodo_pago }).then(cerrarMovimiento, () => {});
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
        pageSize={15}
        pageSizeOptions={[10, 15, 25]}
      />

      <MovimientoStockModal
        abierto={Boolean(movimiento)}
        tipo={movimiento?.tipo}
        producto={movimiento?.producto}
        onClose={cerrarMovimiento}
        onConfirmar={confirmarMovimiento}
        cargando={registrar.isPending}
        errorServidor={registrar.isError ? mensajeDeError(registrar.error, "No se pudo registrar el movimiento") : null}
      />
    </>
  );
}
