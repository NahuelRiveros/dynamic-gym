import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard, CheckCircle2, AlertTriangle, Clock,
  Lock, ExternalLink, RefreshCw, Zap, CalendarDays,
  Receipt, BadgeCheck,
} from "lucide-react";
import { getEstadoSuscripcion, crearPagoSuscripcion, getHistorialPagos } from "../../api/suscripcion_api";
import { formatearFechaAR } from "../../components/form/formatear_fecha";

/* ── helpers ─────────────────────────────────────────────────────────────── */

function fmtFecha(val) {
  if (!val) return "—";
  return formatearFechaAR(String(val).slice(0, 10)) || "—";
}

function money(v) {
  return Number(v || 0).toLocaleString("es-AR", {
    style: "currency", currency: "ARS", maximumFractionDigits: 0,
  });
}

const ESTADO_UI = {
  activo: {
    bg:     "bg-emerald-50 border-emerald-200",
    badge:  "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon:   <CheckCircle2 size={14} />,
    label:  "Activo",
  },
  aviso: {
    bg:     "bg-yellow-50 border-yellow-200",
    badge:  "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon:   <AlertTriangle size={14} />,
    label:  "Por vencer",
  },
  gracia: {
    bg:     "bg-orange-50 border-orange-200",
    badge:  "bg-orange-100 text-orange-700 border-orange-200",
    icon:   <Clock size={14} />,
    label:  "Período de gracia",
  },
  vencido: {
    bg:     "bg-red-50 border-red-200",
    badge:  "bg-red-100 text-red-700 border-red-200",
    icon:   <Lock size={14} />,
    label:  "Vencido",
  },
  sin_suscripcion: {
    bg:     "bg-slate-50 border-slate-200",
    badge:  "bg-slate-100 text-slate-600 border-slate-200",
    icon:   <AlertTriangle size={14} />,
    label:  "Sin configurar",
  },
};

/* ── página ──────────────────────────────────────────────────────────────── */

export default function SuscripcionPage() {
  const [pagando, setPagando] = useState(false);
  const [errorPago, setErrorPago] = useState(null);

  const {
    data: estado,
    isLoading,
    refetch,
  } = useQuery({
    queryKey:  ["suscripcion-estado"],
    queryFn:   getEstadoSuscripcion,
    staleTime: 60_000,
  });

  const {
    data: historial,
    isLoading: cargandoHistorial,
  } = useQuery({
    queryKey: ["suscripcion-pagos"],
    queryFn:  getHistorialPagos,
    staleTime: 120_000,
  });

  async function pagar() {
    setPagando(true);
    setErrorPago(null);
    try {
      const r = await crearPagoSuscripcion();
      if (!r.ok) { setErrorPago(r.mensaje || "Error al crear el pago"); return; }

      // En producción usa init_point; en sandbox usa sandbox_init_point
      const url = r.init_point || r.sandbox_init_point;
      if (!url) { setErrorPago("No se pudo obtener la URL de pago"); return; }

      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setErrorPago(
        err?.response?.data?.mensaje ||
        err?.message ||
        "Error al conectar con MercadoPago"
      );
    } finally {
      setPagando(false);
    }
  }

  const ui        = ESTADO_UI[estado?.estado || "sin_suscripcion"] ?? ESTADO_UI.sin_suscripcion;
  const bloqueado = estado?.bloqueado;
  const pagos     = historial?.pagos ?? [];

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-3xl space-y-5">

        {/* ── ENCABEZADO ── */}
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm shadow-blue-500/10">
          <div className="h-1 w-full bg-linear-to-r from-blue-600 via-blue-500 to-cyan-400" />
          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-sm shadow-blue-500/25">
                <CreditCard size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold text-slate-900">Suscripción al Software</h1>
                <p className="text-xs text-slate-400">Dynamic Gym — Plan mensual</p>
              </div>
            </div>
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition"
            >
              <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
              Actualizar
            </button>
          </div>
        </div>

        {/* ── CARDS DE ESTADO ── */}
        {isLoading ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-slate-400 text-sm">
            Cargando estado de suscripción…
          </div>
        ) : (
          <div className={`rounded-2xl border p-5 ${ui.bg}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

              {/* Info plan */}
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${ui.badge}`}>
                    {ui.icon} {ui.label}
                  </span>
                  {estado?.plan_nombre && (
                    <span className="text-sm font-semibold text-slate-700">{estado.plan_nombre}</span>
                  )}
                </div>

                {estado?.mensaje && (
                  <p className="text-sm text-slate-700 font-medium">{estado.mensaje}</p>
                )}

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {estado?.fecha_vencimiento && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1">
                        <CalendarDays size={9} /> Vencimiento
                      </p>
                      <p className="text-sm font-extrabold text-slate-800">{fmtFecha(estado.fecha_vencimiento)}</p>
                    </div>
                  )}
                  {estado?.precio > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1">
                        <Zap size={9} /> Precio mensual
                      </p>
                      <p className="text-sm font-extrabold text-slate-800">{money(estado.precio)}</p>
                    </div>
                  )}
                  {estado?.cliente_nombre && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1">
                        <BadgeCheck size={9} /> Cliente
                      </p>
                      <p className="text-sm font-bold text-slate-800">{estado.cliente_nombre}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Botón de pago */}
              {estado?.ok && (
                <div className="sm:ml-4 sm:shrink-0">
                  <button
                    onClick={pagar}
                    disabled={pagando}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-sm text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 active:scale-95 transition disabled:opacity-60"
                  >
                    {pagando ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <ExternalLink size={14} />
                    )}
                    {bloqueado ? "Renovar para continuar" : "Renovar plan"}
                  </button>
                  <p className="mt-1.5 text-[10px] text-slate-400 text-center">
                    Pago seguro vía MercadoPago
                  </p>
                </div>
              )}
            </div>

            {/* Error de pago */}
            {errorPago && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                {errorPago}
              </div>
            )}
          </div>
        )}

        {/* ── INFO CICLO DE FACTURACIÓN ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">
            Ciclo de facturación
          </h3>
          <div className="space-y-2">
            {[
              { color: "bg-emerald-400", text: "Activo: más de 10 días antes del vencimiento" },
              { color: "bg-yellow-400",  text: "Aviso: últimos 10 días — se acerca el vencimiento" },
              { color: "bg-orange-400",  text: "Gracia: del 1 al 10 del mes siguiente — renovar urgente" },
              { color: "bg-red-400",     text: "Vencido: pasado el día 10 sin pago — sistema bloqueado" },
            ].map(({ color, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-xs text-slate-600">
                <span className={`h-2 w-2 shrink-0 rounded-full ${color}`} />
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* ── HISTORIAL DE PAGOS ── */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
            <Receipt size={14} className="text-slate-400" />
            <h3 className="text-sm font-bold text-slate-700">Historial de pagos</h3>
          </div>
          {cargandoHistorial ? (
            <div className="px-5 py-6 text-center text-xs text-slate-400">Cargando…</div>
          ) : pagos.length === 0 ? (
            <div className="px-5 py-6 text-center text-xs text-slate-400">
              No hay pagos registrados todavía.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pagos.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-700">
                      {p.periodo_desde && p.periodo_hasta
                        ? `${fmtFecha(p.periodo_desde)} → ${fmtFecha(p.periodo_hasta)}`
                        : fmtFecha(p.creado_en)}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">{p.mp_payment_id}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-blue-700">{money(p.monto)}</span>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                      p.estado === "aprobado"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-red-50 text-red-600 border-red-200"
                    }`}>
                      {p.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
