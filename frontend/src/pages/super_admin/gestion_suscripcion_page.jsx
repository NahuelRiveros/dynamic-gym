import { useEffect, useState } from "react";
import { Shield, RefreshCw, Clock, CalendarCheck, AlertTriangle, CheckCircle } from "lucide-react";
import {
  getSuperEstadoSuscripcion,
  superExtenderSuscripcion,
} from "../../api/suscripcion_api.js";

const OPCIONES_DIAS = [30, 60, 90, 180, 365];

function fmtFecha(f) {
  if (!f) return "—";
  return new Date(f).toLocaleDateString("es-AR", {
    year: "numeric", month: "long", day: "numeric", timeZone: "America/Argentina/Cordoba",
  });
}

export default function GestionSuscripcionPage() {
  const [estado, setEstado]       = useState(null);
  const [cargando, setCargando]   = useState(true);
  const [error, setError]         = useState("");
  const [diasSel, setDiasSel]     = useState(30);
  const [extendiendo, setExtendiendo] = useState(false);
  const [exito, setExito]         = useState("");

  async function cargarEstado() {
    try {
      setCargando(true);
      setError("");
      const r = await getSuperEstadoSuscripcion();
      setEstado(r);
    } catch (e) {
      setError(e?.response?.data?.mensaje || "No se pudo obtener el estado de suscripción");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargarEstado(); }, []);

  async function handleExtender() {
    if (!window.confirm(`¿Extender la suscripción ${diasSel} días a partir del vencimiento actual?`)) return;
    try {
      setExtendiendo(true);
      setExito("");
      setError("");
      const r = await superExtenderSuscripcion(diasSel);
      setExito(`Suscripción extendida. Nuevo vencimiento: ${fmtFecha(r.nuevo_vencimiento)}`);
      await cargarEstado();
    } catch (e) {
      setError(e?.response?.data?.mensaje || "Error al extender la suscripción");
    } finally {
      setExtendiendo(false);
    }
  }

  const diasRestantes = estado?.dias_restantes ?? null;
  const vencida       = estado?.bloqueado === true;
  const alertaDias    = diasRestantes !== null && diasRestantes <= 14 && !vencida;

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6">
      <div className="mx-auto w-full max-w-2xl space-y-4">

        {/* ── ENCABEZADO ── */}
        <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm shadow-violet-500/10">
          <div className="h-1 w-full bg-linear-to-r from-violet-600 via-violet-500 to-purple-400" />
          <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm shadow-violet-500/30">
                <Shield size={11} />
                Super Admin
              </span>
              <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Suscripción del sistema</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Gestioná la vigencia del plan de Dynamic Gym como software.
              </p>
            </div>
            <button
              type="button"
              onClick={cargarEstado}
              disabled={cargando}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm disabled:opacity-50 self-start sm:self-auto"
            >
              <RefreshCw size={13} className={cargando ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* ── ERROR / ÉXITO ── */}
        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle size={15} className="shrink-0" />
            {error}
          </div>
        )}
        {exito && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle size={15} className="shrink-0" />
            {exito}
          </div>
        )}

        {/* ── ESTADO ACTUAL ── */}
        {cargando ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-400 shadow-sm">
            Cargando estado…
          </div>
        ) : estado ? (
          <>
            {/* alerta vencimiento próximo */}
            {(alertaDias || vencida) && (
              <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${
                vencida
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}>
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <div className="text-sm font-medium">
                  {vencida
                    ? "La suscripción está VENCIDA. Los admins del gym ya no pueden registrar datos."
                    : `Quedan solo ${diasRestantes} día(s) para el vencimiento. Extendé pronto.`}
                </div>
              </div>
            )}

            {/* cards de estado */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <InfoCard
                icono={<CalendarCheck size={16} className="text-violet-600" />}
                titulo="Vencimiento"
                valor={fmtFecha(estado.fecha_vencimiento)}
              />
              <InfoCard
                icono={<Clock size={16} className={diasRestantes <= 14 ? "text-red-500" : "text-emerald-500"} />}
                titulo="Días restantes"
                valor={diasRestantes !== null ? `${diasRestantes} días` : "—"}
                destacar={diasRestantes !== null && diasRestantes <= 14}
              />
              <InfoCard
                icono={
                  vencida
                    ? <AlertTriangle size={16} className="text-red-500" />
                    : <CheckCircle size={16} className="text-emerald-500" />
                }
                titulo="Estado"
                valor={vencida ? "Vencido" : (estado.estado ?? "Activo")}
                verde={!vencida}
                rojo={vencida}
              />
            </div>

            {/* datos del cliente */}
            {estado.cliente_nombre && (
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm text-slate-600 shadow-sm">
                <span className="font-semibold text-slate-800">Cliente registrado: </span>
                {estado.cliente_nombre}
                {estado.precio ? ` · $${Number(estado.precio).toLocaleString("es-AR")} / renovación` : ""}
              </div>
            )}

            {/* ── EXTENDER ── */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-3.5">
                <p className="text-sm font-bold text-slate-800">Extender suscripción</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Los días se suman al vencimiento actual, no a hoy.
                </p>
              </div>
              <div className="px-5 py-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {OPCIONES_DIAS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDiasSel(d)}
                      className={[
                        "rounded-xl px-4 py-2 text-sm font-bold transition",
                        diasSel === d
                          ? "bg-violet-600 text-white shadow-sm shadow-violet-500/30"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      {d === 365 ? "1 año" : `${d} días`}
                    </button>
                  ))}
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-500">
                  Nuevo vencimiento estimado:{" "}
                  <span className="font-bold text-slate-800">
                    {estado.fecha_vencimiento
                      ? fmtFecha(new Date(new Date(estado.fecha_vencimiento).getTime() + diasSel * 86400000).toISOString())
                      : "—"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleExtender}
                  disabled={extendiendo}
                  className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-violet-500/20 hover:bg-violet-500 transition disabled:opacity-60"
                >
                  {extendiendo ? "Extendiendo…" : `Extender ${diasSel === 365 ? "1 año" : `${diasSel} días`}`}
                </button>
              </div>
            </div>
          </>
        ) : null}

      </div>
    </div>
  );
}

function InfoCard({ icono, titulo, valor, destacar, verde, rojo }) {
  return (
    <div className={`rounded-2xl border px-4 py-3.5 shadow-sm bg-white ${
      rojo ? "border-red-200" : verde ? "border-emerald-200" : destacar ? "border-amber-200" : "border-slate-200"
    }`}>
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {icono}
        {titulo}
      </div>
      <p className={`mt-1.5 text-lg font-extrabold leading-tight ${
        rojo ? "text-red-600" : verde ? "text-emerald-700" : destacar ? "text-amber-700" : "text-slate-900"
      }`}>
        {valor}
      </p>
    </div>
  );
}
