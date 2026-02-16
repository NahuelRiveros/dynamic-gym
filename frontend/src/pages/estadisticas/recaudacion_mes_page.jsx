import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getRecaudacionDiaria } from "../../api/estadisticas_api";

export default function RecaudacionCalendarioDia() {
  const { anio, mes } = useParams();
  const nav = useNavigate();

  const year = Number(anio);
  const month = Number(mes);

  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      setError(null);
      try {
        const r = await getRecaudacionDiaria(year, month);
        if (!r?.ok) {
          setError(r?.mensaje || "No se pudo cargar recaudación diaria");
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

    if (Number.isFinite(year) && Number.isFinite(month)) cargar();
  }, [year, month]);

  // calendario
  const diasDelMes = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);
  const primerDiaSemana = useMemo(() => new Date(year, month - 1, 1).getDay(), [year, month]); // 0=domingo

  const mapaDias = useMemo(() => {
    const map = new Map();
    for (const it of data?.items || []) {
      // it.dia: 'YYYY-MM-DD' -> dia '01'..'31'
      const dia = Number(String(it.dia).slice(8, 10));
      map.set(dia, Number(it.total || 0));
    }
    return map;
  }, [data]);

  const totalMes = useMemo(() => {
    return Array.from(mapaDias.values()).reduce((acc, v) => acc + v, 0);
  }, [mapaDias]);

  const diasCalendario = useMemo(() => {
    const arr = [];
    for (let i = 0; i < primerDiaSemana; i++) arr.push(null);
    for (let d = 1; d <= diasDelMes; d++) arr.push(d);
    return arr;
  }, [diasDelMes, primerDiaSemana]);

  function mesLabel(m) {
    const meses = [
      "Enero","Febrero","Marzo","Abril","Mayo","Junio",
      "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
    ];
    return meses[m - 1] ?? "";
  }

  function money(v) {
    return Number(v || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS" });
  }

  function irMesAnterior() {
    const nuevaFecha = new Date(year, month - 2);
    nav(`/estadisticas/recaudaciones/${nuevaFecha.getFullYear()}/${nuevaFecha.getMonth() + 1}`);
  }

  function irMesSiguiente() {
    const nuevaFecha = new Date(year, month);
    nav(`/estadisticas/recaudaciones/${nuevaFecha.getFullYear()}/${nuevaFecha.getMonth() + 1}`);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto w-full max-w-6xl rounded-3xl border bg-white shadow-sm p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={irMesAnterior}
            className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200"
          >
            ←
          </button>

          <div className="text-center">
            <h1 className="text-2xl font-extrabold">
              {mesLabel(month)} {year}
            </h1>
            <p className="text-sm text-gray-500">
              Total del mes: {money(totalMes)}
            </p>
          </div>

          <button
            onClick={irMesSiguiente}
            className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200"
          >
            →
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {cargando ? (
          <div className="text-sm text-gray-600">Cargando…</div>
        ) : (
          <>
            {/* Encabezado */}
            <div className="grid grid-cols-7 gap-2 text-center font-semibold text-sm text-gray-500 mb-2">
              {["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* Calendario */}
            <div className="grid grid-cols-7 gap-2">
              {diasCalendario.map((dia, i) => {
                if (!dia) return <div key={i} />;

                const total = mapaDias.get(dia) ?? 0;
                const tiene = total > 0;

                return (
                  <div
                    key={dia}
                    className={[
                      "rounded-2xl border p-3 min-h-22.5 transition",
                      tiene ? "bg-green-50 border-green-300" : "bg-white border-gray-200",
                    ].join(" ")}
                  >
                    <div className="text-xs font-bold text-gray-600">{dia}</div>

                    {tiene ? (
                      <div className="mt-2 text-sm font-extrabold text-green-700">
                        {money(total)}
                      </div>
                    ) : (
                      <div className="mt-2 text-[11px] text-gray-400">—</div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="mt-6 text-right">
          <button
            onClick={() => nav("/estadisticas/recaudaciones-mensual")}
            className="rounded-2xl bg-black text-white px-4 py-2 font-semibold"
          >
            Volver a meses
          </button>
        </div>
      </div>
    </div>
  );
}
