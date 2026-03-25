import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getRecaudacionDetalleDia } from "../../api/recaudacion_api";

export default function RecaudacionesDetallePage() {
  const { anio, mes, dia } = useParams();
  const nav = useNavigate();

  const year = Number(anio);
  const month = Number(mes);
  const day = Number(dia);

  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      setError(null);

      try {
        const r = await getRecaudacionDetalleDia(year, month, day);

        if (!r?.ok) {
          setError(r?.mensaje || "No se pudo cargar el detalle del día");
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

    if (
      Number.isFinite(year) &&
      Number.isFinite(month) &&
      Number.isFinite(day)
    ) {
      cargar();
    }
  }, [year, month, day]);

  const totalDia = useMemo(() => Number(data?.total_dia || 0), [data]);
  const cantidadCobros = useMemo(() => Number(data?.cantidad_cobros || 0), [data]);

  function money(v) {
    return Number(v || 0).toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    });
  }

  function fechaTitulo() {
    const fecha = new Date(year, month - 1, day);

    if (isNaN(fecha.getTime())) return "-";

    return fecha.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function horaLabel(fechaHora) {
   if (!fechaHora) return "-";

  const [fecha, hora] = String(fechaHora).split("T");

  return `${fecha} ${hora?.slice(0, 8)}`;
}

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-4 sm:px-4 sm:py-6">
      <div className="mx-auto w-full max-w-6xl rounded-2xl border bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Detalle de recaudación</p>
            <h1 className="text-xl font-extrabold capitalize sm:text-2xl">
              {fechaTitulo()}
            </h1>
          </div>

          <button
            onClick={() => nav(`/estadisticas/recaudaciones/${year}/${month}`)}
            className="rounded-2xl bg-gray-100 px-4 py-2.5 text-sm font-semibold hover:bg-gray-200"
          >
            ← Volver al mes
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Total del día</p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">
              {money(totalDia)}
            </p>
          </div>

          <div className="rounded-2xl border bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Cobros registrados</p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">
              {cantidadCobros}
            </p>
          </div>

          <div className="rounded-2xl border bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Periodo</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              {String(day).padStart(2, "0")}/{String(month).padStart(2, "0")}/{year}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {cargando ? (
          <div className="text-sm text-gray-600">Cargando detalle…</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Dia / Hora</th>
                    <th className="px-4 py-3 font-semibold">Alumno</th>
                    <th className="px-4 py-3 font-semibold">Plan</th>
                    <th className="px-4 py-3 font-semibold">Método</th>
                    <th className="px-4 py-3 font-semibold">Cobrado por</th>
                    <th className="px-4 py-3 text-right font-semibold">Monto</th>
                  </tr>
                </thead>

                <tbody>
                  {(data?.items || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No hay cobros registrados para este día.
                      </td>
                    </tr>
                  ) : (
                    (data?.items || []).map((item, idx) => (
                      <tr key={`${item.gym_fecha_id || idx}-${item.fecha_hora || idx}`} className="border-t">
                        <td className="whitespace-nowrap px-4 py-3">
                          {horaLabel(item.fecha_hora)}
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {item.alumno || "-"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.alumno_documento || ""}
                          </div>
                        </td>

                        <td className="px-4 py-3">{item.plan || "-"}</td>
                        <td className="px-4 py-3">{item.metodo_pago || "-"}</td>
                        <td className="px-4 py-3">{item.usuario_cobro || "-"}</td>

                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {money(item.monto)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}