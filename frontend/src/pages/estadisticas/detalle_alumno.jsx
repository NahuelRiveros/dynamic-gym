import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAlumnoDetalle } from "../../api/alumnos_api";
import { ArrowLeft, BadgeCheck, Ban, CreditCard, RefreshCw } from "lucide-react";
import SubmitButton from "../../components/form/submit_button";
import Card from "../../components/form/card"; // ✅ tu Card nueva
import { formatearFechaAR } from "../../components/form/formatear_fecha";

export default function DetalleAlumnoPage() {
  const { id } = useParams();
  const nav = useNavigate();

  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const r = await getAlumnoDetalle(id);

      if (!r?.ok) {
        setError(r?.mensaje || "No se pudo cargar el alumno");
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
  }, [id]);

  const alumno = data?.alumno;
  const planActual = data?.plan_actual;
  const planes = data?.planes || [];
  const resumen = data?.resumen;

  const restringido = useMemo(() => {
    const t = String(alumno?.estado_desc || "").toLowerCase();
    return t.includes("restring") || t.includes("bloq") || t.includes("inactiv");
  }, [alumno]);

  const loadingCards = cargando && !data;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto w-full max-w-6xl">
        <div className="rounded-3xl border bg-white shadow-sm p-5 md:p-6">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <SubmitButton
                type="button"
                onClick={() => nav(-1)}
                className="bg-green-800"
              >
                <span className="inline-flex items-center gap-2">
                  <ArrowLeft size={16} />
                  Volver
                </span>
              </SubmitButton>

              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold">
                  {alumno
                    ? `${alumno.gym_persona_apellido} ${alumno.gym_persona_nombre}`
                    : "Detalle de alumno"}
                </h1>
                <p className="mt-1 text-sm text-gray-600 font-bold">
                  DNI: {alumno?.gym_persona_documento || "—"} · Email:{" "}
                  {alumno?.gym_persona_email || "—"}
                </p>
              </div>
            </div>

            <SubmitButton
              type="button"
              onClick={cargar}
              disabled={cargando}
              className="bg-green-800"
            >
              <RefreshCw size={16} className={cargando ? "animate-spin" : ""} />
              {cargando ? "Cargando..." : "Actualizar"}
            </SubmitButton>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Cards principales */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card
              title="Estado"
              icon={restringido ? <Ban size={18} /> : <BadgeCheck size={18} />}
              value={alumno?.estado_desc || "—"}
              subtitle={restringido ? "Restringido" : "Habilitado"}
              tone={restringido ? "danger" : "ok"}
              loading={loadingCards}
            />

            <Card
              title="Plan actual"
              icon={<CreditCard size={18} />}
              value={planActual?.tipoplan_desc || "—"}
              subtitle={
                planActual?.fin
                  ? `Vence: ${formatearFechaAR(String(planActual.fin).slice(0, 10))}`
                  : "Sin plan"
              }
              tone={planActual?.vigente_hoy ? "info" : "default"}
              loading={loadingCards}
            />

            <Card
              title="Ingresos disponibles"
              icon={<CreditCard size={18} />}
              value={
                planActual?.ingresos_disponibles != null
                  ? String(planActual.ingresos_disponibles)
                  : "—"
              }
              subtitle={planActual?.vigente_hoy ? "Plan vigente hoy" : "No vigente hoy"}
              tone={
                planActual?.vigente_hoy && Number(planActual?.ingresos_disponibles ?? 0) > 0
                  ? "ok"
                  : "danger"
              }
              loading={loadingCards}
            />
          </div>

          {/* Resumen pagos */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <MiniStat
              label="Cantidad de planes/pagos"
              value={String(resumen?.total_pagos ?? planes.length)}
            />
            <MiniStat
              label="Total recaudado"
              value={money(resumen?.total_recaudado ?? 0)}
            />
            <MiniStat
              label="Último pago (aprox)"
              value={
                resumen?.ultimo_pago_fecha ||
                (planes?.[0]?.inicio ? String(planes[0].inicio).slice(0, 10) : "—")
              }
            />
          </div>

          {/* Historial de planes/pagos */}
          <div className="mt-6">
            <h2 className="text-lg font-extrabold">Historial de planes / pagos</h2>
            <p className="text-sm text-gray-600 mt-1">Pagos hechos por el alumno</p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-3 pr-3">Plan</th>
                    <th className="py-3 pr-3">Inicio</th>
                    <th className="py-3 pr-3">Fin</th>
                    <th className="py-3 pr-3">Monto</th>
                    <th className="py-3 pr-3">Método</th>
                    <th className="py-3 pr-3">Ingresos disp.</th>
                  </tr>
                </thead>
                <tbody>
                  {cargando ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-t">
                        <td className="py-4 pr-3">
                          <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
                        </td>
                        <td className="py-4 pr-3">
                          <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                        </td>
                        <td className="py-4 pr-3">
                          <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                        </td>
                        <td className="py-4 pr-3">
                          <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                        </td>
                        <td className="py-4 pr-3">
                          <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                        </td>
                        <td className="py-4 pr-3">
                          <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : planes.length ? (
                    planes.map((pl) => (
                      <tr key={pl.plan_id} className="border-t">
                        <td className="py-4 pr-3 font-semibold">
                          {pl.tipoplan_desc || "—"}
                        </td>
                        <td className="py-4 pr-3">
                          {pl.inicio ? String(pl.inicio).slice(0, 10) : "—"}
                        </td>
                        <td className="py-4 pr-3">
                          {pl.fin ? String(pl.fin).slice(0, 10) : "—"}
                        </td>
                        <td className="py-4 pr-3">{money(pl.monto_pagado)}</td>
                        <td className="py-4 pr-3">{pl.metodo_pago || "—"}</td>
                        <td className="py-4 pr-3">{pl.ingresos_disponibles ?? "—"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-t">
                      <td colSpan={6} className="py-6 text-center text-gray-500">
                        No hay historial de planes/pagos para este alumno.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-lg font-extrabold">{value}</div>
    </div>
  );
}

function money(v) {
  const n = Number(v || 0);
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}