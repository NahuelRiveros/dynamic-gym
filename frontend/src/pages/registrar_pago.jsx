import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { CreditCard, Search, UserCheck, Dumbbell, CheckCircle2, CalendarDays, Ticket, Banknote } from "lucide-react";
import PagoSuccessModal from "../components/modal/pago_success_modal.jsx";
import { obtenerPlanes } from "../api/planes_api";
import { registrarPago, previewPago } from "../api/pagos_api";

import FormError from "../components/form/form_error";
import InputField from "../components/form/input_field";
import SelectField from "../components/form/select_field";
import { formatearFechaAR } from "../components/form/formatear_fecha.js";
import {
  normalizarDocumento,
  calcularNuevoPlanDesdeHoy,
} from "../components/utils/pagos_utils.js";

function SectionHeader({ number, label, icon: Icon, done = false }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${done ? "bg-emerald-500" : "bg-sky-500"}`}>
        {done ? <CheckCircle2 size={14} /> : number}
      </div>
      <div className="flex items-center gap-2">
        {Icon && <Icon size={15} className="text-sky-600" />}
        <span className="text-sm font-bold uppercase tracking-wider text-slate-600">{label}</span>
      </div>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

// Convierte Date a ISO string para formatearFechaAR
function dateToISO(d) {
  if (!d) return null;
  if (typeof d === "string") return d.slice(0, 10);
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return null;
}

export default function RegistrarPagoPage() {
  const [planes, setPlanes]           = useState([]);
  const [cargandoPlanes, setCargandoPlanes] = useState(false);
  const [cargando, setCargando]       = useState(false);
  const [error, setError]             = useState(null);
  const [alumno, setAlumno]           = useState(null);
  const [planVigente, setPlanVigente] = useState(null);
  const [modalOpen, setModalOpen]     = useState(false);
  const [ultimoPago, setUltimoPago]   = useState(null);
  const [tipoPlanId, setTipoPlanId]   = useState("");

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      documento:   "",
      metodo_pago: "EFECTIVO",
    },
  });

  const documento = watch("documento");

  async function cargarPlanes() {
    setCargandoPlanes(true);
    try {
      const r = await obtenerPlanes();
      const lista = Array.isArray(r?.data) ? r.data : [];
      setPlanes(
        lista
          .filter((p) => p.activo)
          .map((p) => ({
            value:        p.id,
            label:        `${p.descripcion}`,
            descripcion:  p.descripcion,
            dias_totales: p.dias_totales,
            ingresos:     p.ingresos,
            precio:       Number(p.precio),
          }))
      );
    } catch { setPlanes([]); }
    finally { setCargandoPlanes(false); }
  }

  useEffect(() => { cargarPlanes(); }, []);

  function limpiar() {
    setAlumno(null);
    setPlanVigente(null);
    setError(null);
    setValue("documento",   "");
    setValue("metodo_pago", "EFECTIVO");
    setTipoPlanId("");
  }

  async function buscarAlumno() {
    setError(null);
    setAlumno(null);
    setPlanVigente(null);
    const doc = normalizarDocumento(documento);
    if (!doc || !/^\d+$/.test(doc)) { setError("DNI inválido (solo números)"); return; }
    setCargando(true);
    try {
      const r = await previewPago(doc);
      if (!r?.ok) { setError(r?.mensaje || "No se pudo buscar el alumno"); return; }
      setAlumno(r.alumno);
      setPlanVigente(r.ultimo_pago || null);
      setValue("documento", doc);
    } catch (e) {
      setError(e?.response?.data?.mensaje || e?.message || "Error buscando alumno");
    } finally { setCargando(false); }
  }

  const planSeleccionado      = useMemo(() => planes.find((p) => Number(p.value) === Number(tipoPlanId)) || null, [planes, tipoPlanId]);
  const diasSeleccionados     = Number(planSeleccionado?.dias_totales ?? 0);
  const ingresosSeleccionados = Number(planSeleccionado?.ingresos ?? 0);
  const precioSeleccionado    = Number(planSeleccionado?.precio ?? 0);
  const nuevoPlanInfo         = useMemo(() => calcularNuevoPlanDesdeHoy(diasSeleccionados), [diasSeleccionados]);


  async function onSubmit(values) {
    setError(null);
    if (!alumno?.alumno_id) { setError("Primero buscá y confirmá el alumno por DNI."); return; }
    const doc   = normalizarDocumento(values.documento);
    const monto = precioSeleccionado;
    if (!doc || !/^\d+$/.test(doc))              { setError("DNI inválido");          return; }
    if (!tipoPlanId)                               { setError("Seleccioná un plan");    return; }
    if (!Number.isFinite(monto) || monto <= 0)   { setError("Monto inválido");        return; }
    if (!String(values.metodo_pago ?? "").trim()) { setError("Método de pago obligatorio"); return; }

    setCargando(true);
    try {
      const r = await registrarPago({
        documento:    doc,
        tipo_plan_id: Number(tipoPlanId),
        monto_pagado: monto,
        metodo_pago:  String(values.metodo_pago).trim(),
      });
      if (!r?.ok) { setError(r?.mensaje || "No se pudo registrar el pago"); return; }
      setUltimoPago(r);
      setModalOpen(true);
      limpiar();
    } catch (e) {
      setError(e?.response?.data?.mensaje || e?.message || "Error inesperado");
    } finally { setCargando(false); }
  }

  const alumnoHabilitado = alumno?.estado_id === 1;

  return (
    <>
      <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-2">

        {/* ── PANEL IZQUIERDO ───────────────────────────── */}
        <div className="hidden lg:flex flex-col justify-between bg-[#060a12] px-14 py-16">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15">
              <Dumbbell size={22} className="text-sky-400" />
            </div>
            <span className="font-bold uppercase tracking-widest text-white">Dynamic Gym</span>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-400">
              Gestión de pagos
            </span>
            <h1 className="mt-3 text-5xl font-black uppercase leading-tight text-white">
              REGISTRAR<br />
              <span className="text-sky-400">PAGO</span>
            </h1>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-gray-400">
              Buscá al alumno por DNI, seleccioná el plan y registrá el pago.
              El plan nuevo comienza a partir del día de hoy.
            </p>

            <ul className="mt-8 space-y-3">
              {[
                "Buscar alumno por DNI",
                "Verificar estado actual del plan",
                "Seleccionar nuevo plan",
                "Confirmar monto y método de pago",
              ].map((item, i) => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-300">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-[10px] font-bold text-sky-400">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-gray-700 uppercase tracking-wider">Dynamic Gym · Sistema interno</p>
        </div>

        {/* ── PANEL DERECHO — formulario ─────────────────── */}
        <div className="flex flex-col justify-start px-6 py-12 lg:px-14 overflow-y-auto">
          <div className="w-full max-w-lg mx-auto">

            {/* Header mobile */}
            <div className="lg:hidden mb-8 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 shadow-sm">
                <CreditCard size={13} />
                Registrar pago
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-extrabold text-slate-900">Registrar pago</h2>
              <p className="mt-1 text-sm text-slate-500">
                Buscá al alumno por DNI para continuar.
              </p>
            </div>

            <div className="space-y-8">

              {/* ── PASO 1: Buscar alumno ── */}
              <div>
                <SectionHeader number="1" label="Buscar alumno" icon={Search} done={!!alumno} />
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <InputField
                      label="DNI del alumno"
                      name="documento"
                      register={register}
                      error={errors.documento?.message}
                      placeholder="Ej: 35123456"
                      inputMode="numeric"
                      autoComplete="off"
                      className="font-bold text-xl tracking-wide text-center"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={buscarAlumno}
                    disabled={cargando || !documento.trim()}
                    className="flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-sky-500/20 hover:bg-sky-400 transition-all disabled:opacity-40 disabled:pointer-events-none mb-0.5"
                  >
                    <Search size={15} />
                    {cargando && !alumno ? "Buscando…" : "Buscar"}
                  </button>
                </div>
              </div>

              {/* ── TARJETA ALUMNO ── */}
              {alumno && (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  {/* Header de la tarjeta */}
                  <div className="flex items-center justify-between bg-slate-50 border-b border-slate-100 px-5 py-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <UserCheck size={15} className="text-sky-500" />
                      Alumno encontrado
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${alumnoHabilitado ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${alumnoHabilitado ? "bg-emerald-500" : "bg-rose-500"}`} />
                      {alumno.estado_desc || (alumnoHabilitado ? "Habilitado" : "Restringido")}
                    </span>
                  </div>

                  <div className="px-5 py-4">
                    <p className="text-xl font-extrabold text-slate-900">
                      {alumno.apellido} {alumno.nombre}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-500">DNI {alumno.documento}</p>

                    {/* Plan actual */}
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Plan actual</p>
                        <p className="text-sm font-bold text-slate-800 leading-tight">
                          {planVigente?.tipo_desc || "Sin plan"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Vence</p>
                        <p className="text-sm font-bold text-slate-800">
                          {planVigente?.fin ? formatearFechaAR(planVigente.fin) : "—"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Ingresos</p>
                        <p className="text-sm font-bold text-slate-800">
                          {planVigente?.ingresos_disponibles ?? "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── PREVIEW NUEVO PLAN ── */}
              {alumno && planSeleccionado && (
                <div className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-sky-600 flex items-center gap-2">
                    <CalendarDays size={13} />
                    Preview del nuevo plan
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-sky-400 mb-1">Plan</p>
                      <p className="text-sm font-bold text-sky-900">{planSeleccionado.descripcion}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-sky-400 mb-1">Ingresos</p>
                      <p className="text-sm font-bold text-sky-900">{ingresosSeleccionados || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-sky-400 mb-1">Inicio</p>
                      <p className="text-sm font-bold text-sky-900">
                        {dateToISO(nuevoPlanInfo.inicioEstimado)
                          ? formatearFechaAR(dateToISO(nuevoPlanInfo.inicioEstimado))
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-sky-400 mb-1">Vencimiento</p>
                      <p className="text-sm font-bold text-sky-900">
                        {dateToISO(nuevoPlanInfo.vencimientoEstimado)
                          ? formatearFechaAR(dateToISO(nuevoPlanInfo.vencimientoEstimado))
                          : "—"}
                      </p>
                    </div>
                  </div>
                  {precioSeleccionado > 0 && (
                    <div className="flex items-center gap-2 pt-1 border-t border-sky-200">
                      <Banknote size={14} className="text-sky-500" />
                      <p className="text-sm font-bold text-sky-700">
                        Precio sugerido:{" "}
                        {precioSeleccionado.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── PASO 2: Datos del pago ── */}
              <form onSubmit={handleSubmit(onSubmit)}>
                <SectionHeader number="2" label="Datos del pago" icon={CreditCard} />

                <div className="space-y-4">
                  <SelectField
                    label="Plan"
                    name="tipo_plan_id"
                    options={planes}
                    placeholder={cargandoPlanes ? "Cargando planes…" : "Seleccionar plan…"}
                    disabledVisual={!alumno || cargandoPlanes}
                    value={tipoPlanId}
                    onChange={(e) => setTipoPlanId(e.target.value)}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Monto (ARS)"
                      name="monto_pagado"
                      value={planSeleccionado ? String(precioSeleccionado) : ""}
                      onChange={() => {}}
                      placeholder="—"
                      inputMode="decimal"
                      readOnly={true}
                    />
                    <SelectField
                      label="Método de pago"
                      name="metodo_pago"
                      register={register}
                      options={[
                        { value: "EFECTIVO",       label: "Efectivo"       },
                        { value: "TRANSFERENCIA",  label: "Transferencia"  },
                        { value: "DÉBITO",         label: "Débito"         },
                        { value: "CRÉDITO",        label: "Crédito"        },
                        { value: "MERCADO PAGO",   label: "Mercado Pago"   },
                      ]}
                      disabledVisual={!alumno}
                      asNumber={false}
                    />
                  </div>
                </div>

                <FormError message={error} />

                <div className="mt-6 flex gap-3">
                  <button
                    type="submit"
                    disabled={!alumno || cargando}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-md shadow-sky-500/25 hover:bg-sky-400 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <Ticket size={16} />
                    {cargando ? "Registrando…" : "Registrar pago"}
                  </button>

                  <button
                    type="button"
                    onClick={limpiar}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    Limpiar
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      </div>

      <PagoSuccessModal
        open={modalOpen}
        alumno={ultimoPago?.alumno}
        plan={ultimoPago?.plan}
        pago={ultimoPago?.pago}
        delayMs={6000}
        onFinish={() => { setModalOpen(false); setUltimoPago(null); }}
      />
    </>
  );
}
