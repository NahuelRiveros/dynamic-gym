import { useState } from "react";
import ProductoFormModal from "../../components/modal/producto_form_modal";
import MovimientoStockModal from "../../components/modal/movimiento_stock_modal";
import HistorialStockModal from "../../components/modal/historial_stock_modal";
import DataGrid from "../../components/ui/data_grid/data_grid.jsx";
import ConfirmDialog from "../../components/ui/confirm_dialog.jsx";
import { mensajeDeError } from "../../hook/consultas_utils.js";
import { useCambiarEstadoProducto, useGuardarProducto, useMovimientoStock } from "../../hook/use_stock.js";
import {
  Plus, Edit2, ToggleLeft, ToggleRight,
  PackagePlus, PackageMinus, History,
} from "lucide-react";

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

export default function ProductosTab({ productos, categorias, cargando }) {
  const [modalCatalogoAbierto, setModalCatalogoAbierto] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [productoAConfirmar, setProductoAConfirmar] = useState(null);
  const [movimiento, setMovimiento] = useState(null); // { tipo, producto }
  const [historialProducto, setHistorialProducto] = useState(null);

  const guardar = useGuardarProducto();
  const cambiarEstado = useCambiarEstadoProducto();
  const registrar = useMovimientoStock();

  function abrirNuevo() { guardar.reset(); setProductoSeleccionado(null); setModalCatalogoAbierto(true); }
  function abrirEditar(producto) { guardar.reset(); setProductoSeleccionado(producto); setModalCatalogoAbierto(true); }
  function cerrarModalCatalogo() { setModalCatalogoAbierto(false); setProductoSeleccionado(null); }

  // Si algo falla, el modal queda abierto y muestra el error del servidor.
  async function guardarProducto(datos) {
    await guardar.mutateAsync({ id: productoSeleccionado?.id, datos }).then(cerrarModalCatalogo, () => {});
  }

  function toggleEstado(producto) {
    cambiarEstado.reset();
    setProductoAConfirmar(producto);
  }

  async function confirmarCambioEstado() {
    const p = productoAConfirmar;
    await cambiarEstado.mutateAsync({ id: p.id, activo: !p.activo }).then(() => setProductoAConfirmar(null), () => {});
  }

  function abrirMovimiento(tipo, producto) { registrar.reset(); setMovimiento({ tipo, producto }); }
  function cerrarMovimiento() { setMovimiento(null); }

  async function confirmarMovimiento({ cantidad, motivo }) {
    const { tipo, producto } = movimiento;
    await registrar.mutateAsync({ tipo, id: producto.id, cantidad, motivo }).then(cerrarMovimiento, () => {});
  }

  const totalProductos = productos.length;
  const conStockBajo = productos.filter((p) => p.stock_actual < p.stock_minimo).length;
  const valorizacion = productos.reduce((acc, p) => acc + Number(p.precio_venta) * p.stock_actual, 0);

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
      render: (row) => {
        const bajo = row.stock_actual < row.stock_minimo;
        return (
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
            bajo ? "bg-red-50 text-red-700 border-red-200" : "bg-slate-50 text-slate-600 border-slate-200"
          }`}>
            {row.stock_actual} {bajo && "· bajo"}
          </span>
        );
      },
    },
    {
      key: "activo",
      label: "Estado",
      render: (_, val) => (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${val ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
          {val ? "Activo" : "Inactivo"}
        </span>
      ),
    },
  ];

  const actions = [
    {
      key: "reponer",
      label: "Reponer",
      icon: <PackagePlus size={12} />,
      variant: "success",
      onClick: (row) => abrirMovimiento("entrada", row),
    },
    {
      key: "baja",
      label: "Baja",
      icon: <PackageMinus size={12} />,
      variant: "warning",
      onClick: (row) => abrirMovimiento("baja", row),
      show: (row) => row.stock_actual > 0,
    },
    {
      key: "historial",
      label: "Historial",
      icon: <History size={12} />,
      variant: "default",
      onClick: (row) => setHistorialProducto(row),
    },
    {
      key: "editar",
      label: "Editar",
      icon: <Edit2 size={12} />,
      variant: "default",
      onClick: (row) => abrirEditar(row),
    },
    {
      key: "desactivar",
      label: "Desactivar",
      icon: <ToggleLeft size={12} />,
      variant: "danger",
      onClick: (row) => toggleEstado(row),
      show: (row) => row.activo,
    },
    {
      key: "activar",
      label: "Activar",
      icon: <ToggleRight size={12} />,
      variant: "success",
      onClick: (row) => toggleEstado(row),
      show: (row) => !row.activo,
    },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          type="button" onClick={abrirNuevo}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-500 transition"
        >
          <Plus size={14} /> Nuevo producto
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <StatCard label="Total productos" value={String(totalProductos)} highlight />
        <StatCard label="Con stock bajo" value={String(conStockBajo)} alert={conStockBajo > 0} />
        <StatCard label="Valorización de stock" value={formatearPrecio(valorizacion)} />
      </div>

      <DataGrid
        rows={productos}
        columns={columns}
        keyField="id"
        loading={cargando}
        searchable
        searchPlaceholder="Buscar producto…"
        emptyMessage="No hay productos cargados."
        actions={actions}
        actionsLabel="Acciones"
        pageSize={15}
        pageSizeOptions={[10, 15, 25]}
      />

      <ProductoFormModal
        abierto={modalCatalogoAbierto}
        onClose={cerrarModalCatalogo}
        onGuardar={guardarProducto}
        productoEditar={productoSeleccionado}
        categorias={categorias}
        cargando={guardar.isPending}
        errorServidor={guardar.isError ? mensajeDeError(guardar.error, "No se pudo guardar el producto") : null}
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

      <ConfirmDialog
        open={Boolean(productoAConfirmar)}
        title={productoAConfirmar?.activo ? "¿Desactivar producto?" : "¿Activar producto?"}
        message={
          cambiarEstado.isError
            ? mensajeDeError(cambiarEstado.error, "No se pudo cambiar el estado del producto")
            : `"${productoAConfirmar?.nombre ?? ""}" ${productoAConfirmar?.activo ? "deja de aparecer para vender." : "vuelve a aparecer para vender."}`
        }
        confirmLabel={productoAConfirmar?.activo ? "Desactivar" : "Activar"}
        variant={productoAConfirmar?.activo ? "danger" : "primary"}
        loading={cambiarEstado.isPending}
        onConfirm={confirmarCambioEstado}
        onClose={() => setProductoAConfirmar(null)}
      />

      <HistorialStockModal
        abierto={Boolean(historialProducto)}
        producto={historialProducto}
        onClose={() => setHistorialProducto(null)}
      />
    </>
  );
}

function StatCard({ label, value, highlight, alert }) {
  return (
    <div className={[
      "rounded-2xl border px-4 py-3.5 shadow-sm",
      highlight ? "border-blue-200 bg-linear-to-br from-blue-600 to-blue-500 shadow-blue-500/20"
        : alert  ? "border-red-200 bg-red-50"
        : "border-slate-200 bg-white",
    ].join(" ")}>
      <div className={`text-[11px] font-bold uppercase tracking-wider ${highlight ? "text-blue-100" : alert ? "text-red-600" : "text-slate-500"}`}>
        {label}
      </div>
      <p className={`mt-1.5 text-2xl font-extrabold leading-tight ${highlight ? "text-white" : alert ? "text-red-700" : "text-slate-900"}`}>
        {value}
      </p>
    </div>
  );
}
