// src/pages/estadisticas/RecaudacionesPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRecaudacionMensual } from "../../api/estadisticas_api";
import { BarChart3, Calendar, Dumbbell, RefreshCw, ArrowRight } from "lucide-react";

export default function RecaudacionCalendario() {
  const nav = useNavigate();
  const anioActual = new Date().getFullYear();

  const [anio, setAnio] = useState(anioActual);
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const r = await getRecaudacionMensual(anio);
      if (!r?.ok) {
        setError(r?.mensaje || "No se pudo cargar recaudación");
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
  }, [anio]);

  const totalAnual = useMemo(() => {
    const items = data?.items || [];
    return items.reduce((acc, it) => acc + Number(it?.total || 0), 0);
  }, [data]);

  // Para asegurar 12 meses siempre (aunque no vengan en la API)
  const meses = useMemo(() => {
    const map = new Map();
    for (const it of data?.items || []) {
      map.set(Number(it.mes), Number(it.total || 0));
    }
    return Array.from({ length: 12 }, (_, i) => {
      const mes = i + 1;
      return { mes, total: map.get(mes) ?? 0 };
    });
  }, [data]);

  const maxMes = useMemo(() => {
    const vals = meses.map((m) => Number(m.total || 0));
    return Math.max(0, ...vals);
  }, [meses]);

  function irAMes(mes) {
    // Ajustá la ruta a la tuya real:
    // Ej: /estadisticas/recaudaciones/2026/2
    nav(`/estadisticas/recaudaciones/${anio}/${mes}`);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto w-full max-w-6xl">
        <div className="rounded-3xl border bg-white shadow-sm p-5 md:p-6">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-green-600/10 px-4 py-1 text-sm font-semibold text-green-700">
                <BarChart3 size={16} />
                Estadísticas
              </div>
              <h1 className="mt-3 text-2xl md:text-3xl font-extrabold">
                Recaudación mensual
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Tocá un mes para ver el calendario con recaudación diaria.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex items-center gap-2 rounded-2xl border px-3 py-2">
                <Calendar size={18} className="text-gray-600" />
                <input
                  type="number"
                  value={anio}
                  onChange={(e) => setAnio(Number(e.target.value))}
                  className="w-28 outline-none"
                  min={2020}
                  max={anioActual + 1}
                />
              </div>

              <button
                type="button"
                onClick={cargar}
                disabled={cargando}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-black text-white px-4 py-2 font-semibold disabled:opacity-50"
              >
                <RefreshCw size={16} className={cargando ? "animate-spin" : ""} />
                {cargando ? "Cargando..." : "Actualizar"}
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
            <StatCard label="Año" value={String(data?.anio ?? anio)} />
            <StatCard label="Total anual" value={money(totalAnual)} />
            <StatCard
              label="Meses con datos"
              value={String((data?.items?.length ?? 0))}
            />
          </div>

          {/* Cards meses */}
          <div className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cargando ? (
                Array.from({ length: 6 }).map((_, i) => <MonthSkeleton key={i} />)
              ) : (
                meses.map((m) => (
                  <MonthCard
                    key={m.mes}
                    mes={m.mes}
                    total={m.total}
                    maxMes={maxMes}
                    onClick={() => irAMes(m.mes)}
                  />
                ))
              )}
            </div>
          </div>

          <p className="mt-5 text-xs text-gray-500">
            Año seleccionado: {anio}. (Cards clickeables → calendario del mes)
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
      <div className="mt-1 text-lg font-extrabold">{value}</div>
    </div>
  );
}

function MonthCard({ mes, total, maxMes, onClick }) {
  const pct = maxMes > 0 ? Math.round((Number(total || 0) / maxMes) * 100) : 0;
  const tiene = Number(total || 0) > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group text-left rounded-3xl border bg-white p-5 shadow-sm transition",
        "hover:shadow-md hover:-translate-y-px",
        "focus:outline-none focus:ring-2 focus:ring-green-500/40",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-600/10 text-green-700">
            <Dumbbell size={18} />
          </div>

          <div>
            <div className="text-xs text-gray-500">Mes</div>
            <div className="text-lg font-extrabold">{mesLabel(mes)}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-700 transition">
          <span className="text-xs font-semibold">Ver</span>
          <ArrowRight size={16} />
        </div>
      </div>

      <div className="mt-4">
        <div className="text-xs text-gray-500">Total</div>
        <div className="mt-1 text-xl font-extrabold">
          {money(total)}
        </div>
      </div>

      {/* barra mini (minimal) */}
      <div className="mt-4">
        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className={[
              "h-full rounded-full",
              tiene ? "bg-green-500" : "bg-gray-300",
            ].join(" ")}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-2 text-[11px] text-gray-500">
          {tiene ? `${pct}% del pico anual` : "Sin recaudación registrada"}
        </div>
      </div>
    </button>
  );
}

function MonthSkeleton() {
  return (
    <div className="rounded-3xl border bg-white p-5 shadow-sm animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gray-100" />
          <div>
            <div className="h-3 w-16 bg-gray-100 rounded" />
            <div className="mt-2 h-5 w-28 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="h-4 w-10 bg-gray-100 rounded" />
      </div>

      <div className="mt-5">
        <div className="h-3 w-10 bg-gray-100 rounded" />
        <div className="mt-2 h-6 w-40 bg-gray-100 rounded" />
      </div>

      <div className="mt-5 h-2 w-full bg-gray-100 rounded-full" />
      <div className="mt-2 h-3 w-32 bg-gray-100 rounded" />
    </div>
  );
}

/* ---------------- helpers ---------------- */

function mesLabel(mes) {
  const m = Number(mes);
  const meses = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
  ];
  return meses[m - 1] ?? `Mes ${mes}`;
}

function money(v) {
  const n = Number(v || 0);
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}
