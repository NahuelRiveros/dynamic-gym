// src/pages/estadisticas/RecaudacionMensual.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRecaudacionMensual } from "../../api/estadisticas_api";
import { BarChart3, Calendar, ChevronRight } from "lucide-react";

export default function RecaudacionMensual() {
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

  function irMes(mes) {
    nav(`/estadisticas/recaudaciones/${anio}/${mes}`);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto w-full max-w-5xl">
        <div className="rounded-3xl border bg-white shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-green-600/10 px-4 py-1 text-sm font-semibold text-green-700">
                <BarChart3 size={16} />
                Estadísticas
              </div>
              <h1 className="mt-3 text-2xl md:text-3xl font-extrabold">
                Recaudación mensual
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Click en un mes para ver el calendario diario.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-2xl border px-3 py-2">
                <Calendar size={18} className="text-gray-600" />
                <input
                  type="number"
                  value={anio}
                  onChange={(e) => setAnio(Number(e.target.value))}
                  className="w-24 outline-none"
                  min={2020}
                  max={anioActual + 1}
                />
              </div>

              <button
                type="button"
                onClick={cargar}
                disabled={cargando}
                className="rounded-2xl bg-black text-white px-4 py-2 font-semibold disabled:opacity-50"
              >
                {cargando ? "Cargando..." : "Actualizar"}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <StatCard label="Año" value={data?.anio ?? anio} />
            <StatCard label="Total anual" value={money(totalAnual)} />
            <StatCard label="Meses con datos" value={(data?.items?.length ?? 0).toString()} />
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="p-3 font-semibold">Mes</th>
                  <th className="p-3 font-semibold">Total</th>
                  <th className="p-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {(data?.items || []).map((it) => (
                  <tr
                    key={it.mes}
                    className="border-t hover:bg-gray-50 cursor-pointer"
                    onClick={() => irMes(it.mes)}
                  >
                    <td className="p-3 font-semibold">{mesLabel(it.mes)}</td>
                    <td className="p-3">{money(it.total)}</td>
                    <td className="p-3 text-right">
                      <ChevronRight className="inline-block text-gray-400" size={18} />
                    </td>
                  </tr>
                ))}

                {!cargando && (data?.items?.length ?? 0) === 0 && !error && (
                  <tr>
                    <td className="p-4 text-gray-600" colSpan={3}>
                      No hay datos para ese año.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-gray-500">Consulta del año {anio}</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-lg font-extrabold">{value}</div>
    </div>
  );
}

function mesLabel(mes) {
  const m = Number(mes);
  const meses = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
  ];
  return meses[m - 1] ?? `Mes ${mes}`;
}

function money(v) {
  const n = Number(v || 0);
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}
