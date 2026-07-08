import { useEffect, useState } from "react";
import { useAuth } from "../../auth/auth_context.jsx";
import ProductoFormModal from "../../components/modal/producto_form_modal";
import MovimientoStockModal from "../../components/modal/movimiento_stock_modal";
import DataGrid from "../../components/table/DataGrid";
import {
  listarProductos,
  crearProducto,
  actualizarProducto,
  cambiarEstadoProducto,
  registrarEntrada,
  registrarVenta,
  registrarBaja,
} from "../../api/stock_api.js";
import {
  Package, Plus, Edit2, ToggleLeft, ToggleRight, RefreshCw,
  PackagePlus, ShoppingCart, PackageMinus,
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

export default function StockPage() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.roles?.includes("admin");

  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [modalCatalogoAbierto, setModalCatalogoAbierto] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [movimiento, setMovimiento] = useState(null); // { tipo, producto }

  async function cargarProductos() {
    try {
      setCargando(true);
      setError("");
      const resp = await listarProductos();
      setProductos(resp.data || []);
    } catch (err) {
      setError(err?.response?.data?.mensaje || "No se pudieron cargar los productos");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargarProductos(); }, []);

  function abrirNuevo() { setProductoSeleccionado(null); setModalCatalogoAbierto(true); }
  function abrirEditar(producto) { setProductoSeleccionado(producto); setModalCatalogoAbierto(true); }
  function cerrarModalCatalogo() { setModalCatalogoAbierto(false); setProductoSeleccionado(null); }

  async function guardarProducto(payload) {
    try {
      setGuardando(true);
      if (productoSeleccionado) {
        await actualizarProducto(productoSeleccionado.id, payload);
      } else {
        await crearProducto(payload);
      }
      cerrarModalCatalogo();
      await cargarProductos();
    } catch (err) {
      setError(err?.response?.data?.mensaje || "No se pudo guardar el producto");
    } finally {
      setGuardando(false);
    }
  }

  async function toggleEstado(producto) {
    const nuevoEstado = !producto.activo;
    const accion = nuevoEstado ? "activar" : "desactivar";
    if (!window.confirm(`¿Seguro que querés ${accion} "${producto.nombre}"?`)) return;
    try {
      await cambiarEstadoProducto(producto.id, nuevoEstado);
      await cargarProductos();
    } catch (err) {
      setError(err?.response?.data?.mensaje || `No se pudo ${accion} el producto`);
    }
  }

  function abrirMovimiento(tipo, producto) { setMovimiento({ tipo, producto }); }
  function cerrarMovimiento() { setMovimiento(null); }

  async function confirmarMovimiento({ cantidad, metodo_pago, motivo }) {
    try {
      setGuardando(true);
      const { tipo, producto } = movimiento;
      if (tipo === "entrada") await registrarEntrada(producto.id, { cantidad });
      if (tipo === "venta") await registrarVenta(producto.id, { cantidad, metodo_pago });
      if (tipo === "baja") await registrarBaja(producto.id, { cantidad, motivo });
      cerrarMovimiento();
      await cargarProductos();
    } catch (err) {
      setError(err?.response?.data?.mensaje || "No se pudo registrar el movimiento");
    } finally {
      setGuardando(false);
    }
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
            {row.categoria && (
              <span className="block text-[11px] text-slate-400">{row.categoria}</span>
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
      key: "vender",
      label: "Vender",
      icon: <ShoppingCart size={12} />,
      variant: "primary",
      onClick: (row) => abrirMovimiento("venta", row),
      show: (row) => row.activo && row.stock_actual > 0,
    },
    {
      key: "reponer",
      label: "Reponer",
      icon: <PackagePlus size={12} />,
      variant: "success",
      onClick: (row) => abrirMovimiento("entrada", row),
    },
    {
      key: "baja",
      label: "Dar de baja",
      icon: <PackageMinus size={12} />,
      variant: "warning",
      onClick: (row) => abrirMovimiento("baja", row),
      show: (row) => row.stock_actual > 0,
    },
    {
      key: "editar",
      label: "Editar",
      icon: <Edit2 size={12} />,
      variant: "default",
      onClick: (row) => abrirEditar(row),
      show: () => esAdmin,
    },
    {
      key: "desactivar",
      label: "Desactivar",
      icon: <ToggleLeft size={12} />,
      variant: "danger",
      onClick: (row) => toggleEstado(row),
      show: (row) => esAdmin && row.activo,
    },
    {
      key: "activar",
      label: "Activar",
      icon: <ToggleRight size={12} />,
      variant: "success",
      onClick: (row) => toggleEstado(row),
      show: (row) => esAdmin && !row.activo,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6">
      <div className="mx-auto w-full max-w-6xl space-y-4">

        {/* ── ENCABEZADO ── */}
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm shadow-blue-500/10">
          <div className="h-1 w-full bg-linear-to-r from-blue-600 via-blue-500 to-cyan-400" />
          <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm shadow-blue-500/30">
                <Package size={11} />
                Stock
              </span>
              <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Mercadería del local</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Agua, bebidas, suplementos y demás productos que se venden en el gym.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button" onClick={cargarProductos} disabled={cargando}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
              >
                <RefreshCw size={13} className={cargando ? "animate-spin" : ""} />
              </button>
              {esAdmin && (
                <button
                  type="button" onClick={abrirNuevo}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-500 transition"
                >
                  <Plus size={14} /> Nuevo producto
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total productos" value={String(totalProductos)} highlight />
          <StatCard label="Con stock bajo" value={String(conStockBajo)} alert={conStockBajo > 0} />
          <StatCard label="Valorización de stock" value={formatearPrecio(valorizacion)} />
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* ── TABLA ── */}
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
          actionsPosition="end"
          pageSize={15}
          pageSizeOptions={[10, 15, 25]}
        />

      </div>

      <ProductoFormModal
        abierto={modalCatalogoAbierto}
        onClose={cerrarModalCatalogo}
        onGuardar={guardarProducto}
        productoEditar={productoSeleccionado}
        cargando={guardando}
      />

      <MovimientoStockModal
        abierto={Boolean(movimiento)}
        tipo={movimiento?.tipo}
        producto={movimiento?.producto}
        onClose={cerrarMovimiento}
        onConfirmar={confirmarMovimiento}
        cargando={guardando}
      />
    </div>
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
