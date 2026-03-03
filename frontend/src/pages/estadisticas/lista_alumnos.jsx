import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAlumnosListado , actualizarEstadosAlumnos} from "../../api/alumnos_api";
import { Search, RefreshCw, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { formatearFechaAR } from "../../components/form/formatear_fecha";
export default function ListaAlumnosPage() {
  const nav = useNavigate();

  const [q, setQ] = useState("");
  const [estadoId, setEstadoId] = useState(""); // opcional (si cargás catálogo después)
  const [planVigente, setPlanVigente] = useState(""); // "", "true", "false"

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  async function cargar({ resetPage = false } = {}) {
    const nextPage = resetPage ? 1 : page;

    setCargando(true);
    setError(null);
    try {
      const params = {
        page: nextPage,
        limit,
        sort: "apellido",
        order: "asc",
        ...(q?.trim() ? { q: q.trim() } : {}),
        ...(estadoId ? { estado_id: estadoId } : {}),
        ...(planVigente ? { plan_vigente: planVigente } : {}),
      };

      const r = await getAlumnosListado(params);
      if (!r?.ok) {
        setError(r?.mensaje || "No se pudo cargar alumnos");
        setData(null);
        return;
      }

      setData(r);
      if (resetPage) setPage(1);
    } catch (e) {
      setError(e?.response?.data?.mensaje || e?.message || "Error inesperado");
      setData(null);
    } finally {
      setCargando(false);
    }
  }
    async function actualizarYRecargar() {
    setCargando(true);
    setError(null);

    try {
        const r = await actualizarEstadosAlumnos();

        // opcional: si querés mostrar cambios:
        // const cambios = r?.total_cambios ?? 0;

        await cargar({ resetPage: false }); // o true si querés volver a página 1
    } catch (e) {
        setError(e?.response?.data?.mensaje || e?.message || "No se pudo actualizar estados");
    } finally {
        setCargando(false);
    }
    }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const items = data?.items || [];
  const pag = data?.pagination || { page: 1, totalPages: 1, total: 0, limit };

  const mostrando = useMemo(() => {
    const desde = (pag.page - 1) * pag.limit + 1;
    const hasta = (pag.page - 1) * pag.limit + items.length;
    if (!items.length) return "0";
    return `${desde}–${hasta}`;
  }, [pag, items]);

  function irDetalle(alumnoId) {
    nav(`/admin/alumnos/${alumnoId}`);
  }

  function estadoBadge(estadoDesc) {
    const t = String(estadoDesc || "").toLowerCase();
    const restringido = t.includes("restring") || t.includes("bloq") || t.includes("inactiv");
    return (
      <span
        className={[
          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border",
          restringido
            ? "bg-red-50 text-red-700 border-red-200"
            : "bg-green-50 text-green-700 border-green-200",
        ].join(" ")}
      >
        {estadoDesc || "—"}
      </span>
    );
  }

  function planBadge(tieneVigente) {
    return (
      <span
        className={[
          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border",
          tieneVigente
            ? "bg-blue-50 text-blue-700 border-blue-200"
            : "bg-gray-50 text-gray-700 border-gray-200",
        ].join(" ")}
      >
        {tieneVigente ? "Plan vigente" : "Sin plan vigente"}
      </span>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto w-full max-w-6xl">
        <div className="rounded-3xl border bg-white shadow-sm p-5 md:p-6">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-green-600/10 px-4 py-1 text-sm font-semibold text-green-700">
                <Users size={16} />
                Alumnos
              </div>
              <h1 className="mt-3 text-2xl md:text-3xl font-extrabold">
                Listado de alumnos
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Mostrando {mostrando} de {pag.total || 0}
              </p>
            </div>

            <button
              type="button"
              onClick={() => actualizarYRecargar()}
              disabled={cargando}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-black text-white px-4 py-2 font-semibold disabled:opacity-50"
            >
              <RefreshCw size={16} className={cargando ? "animate-spin" : ""} />
              {cargando ? "Cargando..." : "Actualizar"}
            </button>
          </div>

          {/* Filtros */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 rounded-2xl border px-3 py-2">
                <Search size={18} className="text-gray-500" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por DNI, nombre, apellido o email..."
                  className="w-full outline-none"
                />
              </div>
            </div>

            <select
              value={planVigente}
              onChange={(e) => setPlanVigente(e.target.value)}
              className="rounded-2xl border px-3 py-2"
            >
              <option value="">Plan (todos)</option>
              <option value="true">Con plan vigente</option>
              <option value="false">Sin plan vigente</option>
            </select>

            <div className="flex gap-2">
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full rounded-2xl border px-3 py-2"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
              </select>

              <button
                type="button"
                onClick={() => cargar({ resetPage: true })}
                className="rounded-2xl border px-4 py-2 font-semibold"
              >
                Buscar
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Tabla */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-3 pr-3">Alumno</th>
                  <th className="py-3 pr-3">DNI</th>
                  <th className="py-3 pr-3">Estado</th>
                  <th className="py-3 pr-3">Plan</th>
                  <th className="py-3 pr-3">Vence</th>
                  <th className="py-3 pr-3">Ingresos</th>
                  <th className="py-3 pr-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-t">
                      <td className="py-4 pr-3">
                        <div className="h-4 w-56 bg-gray-100 rounded animate-pulse" />
                      </td>
                      <td className="py-4 pr-3">
                        <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                      </td>
                      <td className="py-4 pr-3">
                        <div className="h-6 w-28 bg-gray-100 rounded-full animate-pulse" />
                      </td>
                      <td className="py-4 pr-3">
                        <div className="h-6 w-28 bg-gray-100 rounded-full animate-pulse" />
                      </td>
                      <td className="py-4 pr-3">
                        <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                      </td>
                      <td className="py-4 pr-3">
                        <div className="h-4 w-14 bg-gray-100 rounded animate-pulse" />
                      </td>
                      <td className="py-4 pr-3 text-right">
                        <div className="h-9 w-20 bg-gray-100 rounded-2xl animate-pulse ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : items.length ? (
                  items.map((it) => (
                    <tr key={it.gym_alumno_id} className="border-t hover:bg-gray-50">
                      <td className="py-4 pr-3">
                        <div className="font-semibold">
                          {it.gym_persona_apellido} {it.gym_persona_nombre}
                        </div>
                        <div className="text-xs text-gray-500">
                          {it.gym_persona_email || "—"}
                        </div>
                      </td>
                      <td className="py-4 pr-3">{it.gym_persona_documento}</td>
                      <td className="py-4 pr-3">{estadoBadge(it.estado_desc)}</td>
                      <td className="py-4 pr-3">
                        <div className="flex flex-col gap-1">
                          {planBadge(it.tiene_plan_vigente)}
                          <span className="text-xs text-gray-600">
                            {it.plan_tipo_desc || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 pr-3">
                        {formatearFechaAR(it.plan_fin) ? formatearFechaAR(String(it.plan_fin).slice(0, 10)) : "—"}
                      </td>
                      <td className="py-4 pr-3">
                        {it.ingresos_disponibles ?? "—"}
                      </td>
                      <td className="py-4 pr-3 text-right">
                        <button
                          type="button"
                          onClick={() => irDetalle(it.gym_alumno_id)}
                          className="rounded-2xl bg-black text-white px-4 py-2 font-semibold"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t">
                    <td colSpan={7} className="py-6 text-center text-gray-500">
                      No hay alumnos para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-gray-600">
              Página <b>{pag.page}</b> de <b>{pag.totalPages || 1}</b>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((x) => Math.max(1, x - 1))}
                disabled={pag.page <= 1}
                className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 font-semibold disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Anterior
              </button>

              <button
                type="button"
                onClick={() => setPage((x) => Math.min(pag.totalPages || x + 1, x + 1))}
                disabled={pag.page >= (pag.totalPages || 1)}
                className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 font-semibold disabled:opacity-40"
              >
                Siguiente
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Tip: buscá por DNI, apellido o email. Click en “Ver” para detalle.
          </p>
        </div>
      </div>
    </div>
  );
}