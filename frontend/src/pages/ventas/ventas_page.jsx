import { useEffect, useState } from "react";
import { useAuth } from "../../auth/auth_context.jsx";
import { ShoppingCart, Boxes, BarChart2 } from "lucide-react";
import { listarProductos } from "../../api/stock_api.js";
import { getCatalogos } from "../../api/catalogos_api.js";
import VenderTab from "./vender_tab.jsx";
import ProductosTab from "./productos_tab.jsx";
import EstadisticasTab from "./estadisticas_tab.jsx";

const TABS = [
  { key: "vender", label: "Vender", icon: ShoppingCart, soloAdmin: false },
  { key: "productos", label: "Productos", icon: Boxes, soloAdmin: true },
  { key: "estadisticas", label: "Estadísticas", icon: BarChart2, soloAdmin: true },
];

export default function VentasPage() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.roles?.includes("admin");

  const tabsDisponibles = TABS.filter((t) => !t.soloAdmin || esAdmin);
  const [tabActivo, setTabActivo] = useState(tabsDisponibles[0]?.key || "vender");

  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

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

  useEffect(() => {
    cargarProductos();
    getCatalogos()
      .then((resp) => setCategorias(resp.categoriasProducto || []))
      .catch(() => setCategorias([]));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6">
      <div className="mx-auto w-full max-w-6xl space-y-4">

        {/* ── ENCABEZADO + TABS ── */}
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm shadow-blue-500/10">
          <div className="h-1 w-full bg-linear-to-r from-blue-600 via-blue-500 to-cyan-400" />
          <div className="px-5 py-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm shadow-blue-500/30">
              <ShoppingCart size={11} />
              Ventas
            </span>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Ventas y mercadería</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Agua, bebidas, suplementos y demás productos que se venden en el gym.
            </p>
          </div>

          {tabsDisponibles.length > 1 && (
            <div className="flex gap-1 border-t border-slate-100 px-5 py-2">
              {tabsDisponibles.map((tab) => {
                const Icon = tab.icon;
                const activo = tabActivo === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setTabActivo(tab.key)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      activo
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <Icon size={13} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {tabActivo === "vender" && (
          <VenderTab productos={productos} cargando={cargando} onRefrescar={cargarProductos} />
        )}
        {tabActivo === "productos" && esAdmin && (
          <ProductosTab
            productos={productos}
            categorias={categorias}
            cargando={cargando}
            onRefrescar={cargarProductos}
          />
        )}
        {tabActivo === "estadisticas" && esAdmin && <EstadisticasTab />}

      </div>
    </div>
  );
}
