import { useEffect, useMemo, useState } from "react";
import { getAlumnosNuevos } from "../../api/estadisticas_api";
import { Calendar, RefreshCw, Users } from "lucide-react";

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

// primer día del mes actual (ISO)
function primerDiaMesISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export default function AlumnosNuevosPage() {
  const [desde, setDesde] = useState(primerDiaMesISO());
  const [hasta, setHasta] = useState(hoyISO());

  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  async function cargar() {
    setCargando(true);
    setError(null);

    try {
      const r = await getAlumnosNuevos({ desde, hasta });
      if (!r?.ok) {
        setError(r?.mensaje || "No se pudo cargar alumnos nuevos");
        setData(null);
        return;
      }
      setData(r);
    } catch (e) {
      setError(e?.response?.data?.mensaje || e?.message || "Error inesperado");
      setData(null);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = useMemo(() => Number(data?.total || 0), [data]);

  const rangoLabel = useMemo(() => {
    const d = data?.desde ?? desde;
    const h = data?.hasta ?? hasta;
    return `${d} → ${h}`;
  }, [data, desde, hasta]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto w-full max-w-5xl">
        <div className="rounded-3xl border bg-white shadow-sm p-5 md:p-6">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-600/10 px-4 py-1 text-sm font-semibold text-blue-700">
                <Users size={16} />
                Estadísticas
              </div>

              <h1 className="mt-3 text-2xl md:text-3xl font-extrabold">
                Alumnos nuevos
              </h1>

              <p className="mt-1 text-sm text-gray-600">
                Cantidad de alumnos registrados en el rango seleccionado.
              </p>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex items-center gap-2 rounded-2xl border px-3 py-2">
                <Calendar size={18} className="text-gray-600" />
                <span className="text-sm text-gray-600">Desde</span>
                <input
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  className="outline-none"
                />
              </div>

              <div className="flex items-center gap-2 rounded-2xl border px-3 py-2">
                <Calendar size={18} className="text-gray-600" />
                <span className="text-sm text-gray-600">Hasta</span>
                <input
                  type="date"
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                  className="outline-none"
                />
              </div>

              <button
                type="button"
                onClick={cargar}
                disabled={cargando}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-black text-white px-4 py-2 font-semibold disabled:opacity-50"
              >
                <RefreshCw size={16} className={cargando ? "animate-spin" : ""} />
                {cargando ? "Cargando..." : "Aplicar"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Resumen */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <StatCard label="Rango" value={rangoLabel} />
            <StatCard label="Total alumnos nuevos" value={String(total)} />
            <StatCard label="Promedio diario" value={promedioDiario(data)} />
          </div>

          {/* Nota */}
          <p className="mt-5 text-xs text-gray-500">
            {/* Fuente: gym_alumno.gym_alumno_fecharegistro */}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- UI ---------------- */

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-lg font-extrabold break-words">{value}</div>
    </div>
  );
}

/* ---------------- helpers ---------------- */

function promedioDiario(data) {
  const total = Number(data?.total || 0);
  const desde = data?.desde;
  const hasta = data?.hasta;
  if (!desde || !hasta) return "—";

  const d1 = new Date(desde);
  const d2 = new Date(hasta);
  const diff = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
  if (!Number.isFinite(diff) || diff <= 0) return "—";

  const prom = total / diff;
  return prom.toFixed(2);
}
