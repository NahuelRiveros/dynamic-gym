import { useEffect, useMemo, useState } from "react";
import {
  buscarPlanVigente,
  actualizarPlanVigente,
  actualizarPersona,
} from "../../api/admin_alumnos_api";
import { getCatalogos } from "../../api/catalogos_api";
import ConfirmarActualizacionPlanModal from "../../components/modal/confirmar_plan_modal.jsx";
import ConfirmDialog from "../../components/feedback/ConfirmDialog.jsx";
import {
  hoyISO,
  fechaAR,
  money,
  estadoBadge,
  validarFormularioPlan,
  mapearPlanAForm,
} from "../../components/utils/editar_plan_helpers.js";
import {
  ClipboardEdit, Search, BadgeCheck, Ban,
  CreditCard, CalendarDays, Zap, Banknote, Save,
  User, Phone, Mail, IdCard, AlertTriangle,
} from "lucide-react";

// ── micro-componentes ────────────────────────────────────────────
function Label({ children }) {
  return (
    <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
      {children}
    </label>
  );
}
function Field({ label, children }) {
  return <div><Label>{label}</Label>{children}</div>;
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition";

// ── tab IDs ──────────────────────────────────────────────────────
const TAB_PLAN     = "plan";
const TAB_PERSONA  = "persona";

// ── helpers ──────────────────────────────────────────────────────
function mapearPersonaAForm(alumno) {
  if (!alumno) return { nombre: "", apellido: "", documento: "", celular: "", celular_emergencia: "", email: "", fecha_nacimiento: "" };
  return {
    nombre:               alumno.nombre               ?? "",
    apellido:             alumno.apellido             ?? "",
    documento:            String(alumno.documento     ?? ""),
    celular:              String(alumno.celular       ?? ""),
    celular_emergencia:   String(alumno.celular_emergencia ?? ""),
    email:                alumno.email                ?? "",
    fecha_nacimiento:     alumno.fecha_nacimiento     ?? "",
  };
}

// ════════════════════════════════════════════════════════════════
export default function EditarPlanVigentePage() {
  const [documento,    setDocumento]    = useState("");
  const [buscando,     setBuscando]     = useState(false);
  const [error,        setError]        = useState("");
  const [mensaje,      setMensaje]      = useState("");
  const [tiposPlan,    setTiposPlan]    = useState([]);
  const [alumno,       setAlumno]       = useState(null);
  const [planOriginal, setPlanOriginal] = useState(null);
  const [tab,          setTab]          = useState(TAB_PLAN);

  // ── plan form ──────────────────────────────────────────────────
  const [formPlan,       setFormPlan]       = useState({ tipo_plan_id: "", fecha_inicio: hoyISO(), fecha_fin: hoyISO(), ingresos_disponibles: "" });
  const [guardandoPlan,  setGuardandoPlan]  = useState(false);
  const [mostrarModalPlan, setMostrarModalPlan] = useState(false);

  // ── persona form ───────────────────────────────────────────────
  const [formPersona,      setFormPersona]      = useState(mapearPersonaAForm(null));
  const [guardandoPersona, setGuardandoPersona] = useState(false);
  const [mostrarConfirmPersona, setMostrarConfirmPersona] = useState(false);

  useEffect(() => {
    getCatalogos()
      .then((d) => setTiposPlan(d?.tiposPlan || []))
      .catch(() => {});
  }, []);

  function limpiarMensajes() { setError(""); setMensaje(""); }

  function limpiarResultado() {
    setAlumno(null);
    setPlanOriginal(null);
    setFormPlan({ tipo_plan_id: "", fecha_inicio: hoyISO(), fecha_fin: hoyISO(), ingresos_disponibles: "" });
    setFormPersona(mapearPersonaAForm(null));
  }

  async function handleBuscar(e) {
    e.preventDefault();
    limpiarMensajes();
    limpiarResultado();
    const doc = String(documento).replace(/[.\s]/g, "").trim();
    if (!doc) { setError("Ingresá un DNI"); return; }
    try {
      setBuscando(true);
      const r = await buscarPlanVigente(doc);
      setAlumno(r.alumno || null);
      setPlanOriginal(r.plan || null);
      setFormPlan(mapearPlanAForm(r.plan));
      setFormPersona(mapearPersonaAForm(r.alumno));
    } catch (err) {
      setError(err?.response?.data?.mensaje || "No se pudo buscar el alumno");
    } finally {
      setBuscando(false);
    }
  }

  async function refrescarBusqueda(docOverride) {
    const doc = String(docOverride ?? documento).replace(/[.\s]/g, "").trim();
    if (!doc) return;
    const r = await buscarPlanVigente(doc);
    setAlumno(r.alumno || null);
    setPlanOriginal(r.plan || null);
    setFormPlan(mapearPlanAForm(r.plan));
    setFormPersona(mapearPersonaAForm(r.alumno));
  }

  // ── handlers plan ──────────────────────────────────────────────
  function handleChangePlan(e) {
    const { name, value } = e.target;
    setFormPlan((p) => ({ ...p, [name]: value }));
  }

  function handleGuardarPlan(e) {
    e.preventDefault();
    limpiarMensajes();
    const err = validarFormularioPlan({ documento, form: formPlan });
    if (err) { setError(err); return; }
    setMostrarModalPlan(true);
  }

  async function confirmarGuardadoPlan() {
    try {
      setGuardandoPlan(true);
      limpiarMensajes();
      const doc = String(documento).replace(/[.\s]/g, "").trim();
      const payload = {
        documento: doc,
        tipo_plan_id: Number(formPlan.tipo_plan_id),
        fecha_inicio: formPlan.fecha_inicio,
        fecha_fin: formPlan.fecha_fin,
        ingresos_disponibles: formPlan.ingresos_disponibles === "" ? null : Number(formPlan.ingresos_disponibles),
      };
      const r = await actualizarPlanVigente(payload);
      setMensaje(r?.mensaje || "Plan actualizado correctamente");
      setMostrarModalPlan(false);
      await refrescarBusqueda();
    } catch (err) {
      setError(err?.response?.data?.mensaje || "No se pudo actualizar el plan");
      setMostrarModalPlan(false);
    } finally {
      setGuardandoPlan(false);
    }
  }

  // ── handlers persona ───────────────────────────────────────────
  function handleChangePersona(e) {
    const { name, value } = e.target;
    setFormPersona((p) => ({ ...p, [name]: value }));
  }

  function handleGuardarPersona(e) {
    e.preventDefault();
    limpiarMensajes();
    if (!formPersona.nombre.trim() || !formPersona.apellido.trim()) {
      setError("Nombre y apellido son obligatorios");
      return;
    }
    if (!formPersona.documento.trim()) {
      setError("El DNI es obligatorio");
      return;
    }
    setMostrarConfirmPersona(true);
  }

  async function confirmarGuardadoPersona() {
    try {
      setGuardandoPersona(true);
      limpiarMensajes();
      const docActual = String(documento).replace(/[.\s]/g, "").trim();
      const docNuevo  = formPersona.documento.replace(/[.\s]/g, "").trim();
      const payload = {
        documento:            docActual,
        nombre:               formPersona.nombre.trim(),
        apellido:             formPersona.apellido.trim(),
        nuevo_documento:      docNuevo !== docActual ? docNuevo : undefined,
        celular:              formPersona.celular,
        celular_emergencia:   formPersona.celular_emergencia,
        email:                formPersona.email,
        fecha_nacimiento:     formPersona.fecha_nacimiento,
      };
      const r = await actualizarPersona(payload);
      setMensaje(r?.mensaje || "Datos personales actualizados correctamente");
      setMostrarConfirmPersona(false);
      // Si cambió el DNI, actualizamos el campo de búsqueda
      if (docNuevo !== docActual) setDocumento(docNuevo);
      await refrescarBusqueda(docNuevo !== docActual ? docNuevo : undefined);
    } catch (err) {
      setError(err?.response?.data?.mensaje || "No se pudo actualizar los datos personales");
      setMostrarConfirmPersona(false);
    } finally {
      setGuardandoPersona(false);
    }
  }

  // ── computed ───────────────────────────────────────────────────
  const tipoPlanSeleccionado = useMemo(
    () => tiposPlan.find((x) => Number(x.value) === Number(formPlan.tipo_plan_id)),
    [tiposPlan, formPlan.tipo_plan_id]
  );

  const badgeEstado = estadoBadge(alumno?.estado_desc);
  const activo = !String(alumno?.estado_desc || "").toLowerCase().match(/restring|bloq|inactiv/);

  const dniCambia = alumno && formPersona.documento.replace(/[.\s]/g, "") !== String(alumno.documento);

  // ════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6">
      <div className="mx-auto w-full max-w-4xl space-y-4">

        {/* ── ENCABEZADO ── */}
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm shadow-blue-500/10">
          <div className="h-1 w-full bg-linear-to-r from-blue-600 via-blue-500 to-cyan-400" />
          <div className="px-5 py-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm shadow-blue-500/30">
              <ClipboardEdit size={11} />
              Admin
            </span>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Editar alumno</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Buscá al alumno por DNI y editá su plan vigente o sus datos personales.
            </p>
          </div>
        </div>

        {/* ── BÚSQUEDA ── */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Buscar alumno por DNI</span>
          </div>
          <form onSubmit={handleBuscar} className="flex gap-3 p-4">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                placeholder="Ej: 40123456"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white focus:ring-1 focus:ring-blue-400 transition"
              />
            </div>
            <button
              type="submit" disabled={buscando}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-500 transition disabled:opacity-50"
            >
              <Search size={13} />
              {buscando ? "Buscando…" : "Buscar"}
            </button>
          </form>
        </div>

        {/* ── MENSAJES ── */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {mensaje && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{mensaje}</div>
        )}

        {/* ── ALUMNO ENCONTRADO ── */}
        {alumno && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Alumno encontrado</span>
            </div>
            <div className="flex items-center gap-4 p-4">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-lg font-extrabold text-white shadow-sm ${activo ? "bg-blue-600 shadow-blue-500/30" : "bg-slate-400"}`}>
                {((String(alumno.apellido || "")[0] || "") + (String(alumno.nombre || "")[0] || "")).toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-extrabold text-slate-900">{alumno.apellido} {alumno.nombre}</h2>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badgeEstado.className}`}>
                    {activo ? <BadgeCheck size={10} /> : <Ban size={10} />}
                    {badgeEstado.texto}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-slate-500">
                  DNI: <span className="font-semibold text-slate-700">{alumno.documento}</span>
                  <span className="mx-2 text-slate-300">·</span>
                  ID: <span className="font-semibold text-slate-700">{alumno.alumno_id}</span>
                  {alumno.email && (
                    <>
                      <span className="mx-2 text-slate-300">·</span>
                      <span className="text-slate-600">{alumno.email}</span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── TABS ── */}
        {alumno && (
          <div className="flex gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            <TabBtn active={tab === TAB_PLAN} onClick={() => { setTab(TAB_PLAN); limpiarMensajes(); }}>
              <CreditCard size={14} />
              Plan vigente
            </TabBtn>
            <TabBtn active={tab === TAB_PERSONA} onClick={() => { setTab(TAB_PERSONA); limpiarMensajes(); }}>
              <User size={14} />
              Datos personales
            </TabBtn>
          </div>
        )}

        {/* ════════════ TAB: PLAN ════════════ */}
        {alumno && tab === TAB_PLAN && (
          <>
            {planOriginal && (
              <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-blue-50/50 px-4 py-3">
                  <span className="text-xs font-bold uppercase tracking-wide text-blue-600">Plan vigente actual</span>
                </div>
                <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-6">
                  <InfoTile icon={<CreditCard size={13} />}   label="Tipo de plan"    value={planOriginal.tipo_plan || "—"} />
                  <InfoTile icon={<CalendarDays size={13} />} label="Inicio"          value={fechaAR(planOriginal.inicio)} />
                  <InfoTile icon={<CalendarDays size={13} />} label="Fin"             value={fechaAR(planOriginal.fin)} />
                  <InfoTile icon={<Zap size={13} />}          label="Ingresos disp."  value={planOriginal.ingresos_disponibles ?? "—"} />
                  <InfoTile icon={<Banknote size={13} />}     label="Monto pagado"    value={money(planOriginal.monto_pagado)} />
                  <InfoTile icon={<CreditCard size={13} />}   label="Método pago"     value={planOriginal.metodo_pago || "—"} />
                </div>
              </div>
            )}

            {planOriginal && (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-4 py-3">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Modificar plan</span>
                </div>
                <form onSubmit={handleGuardarPlan} className="p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Tipo de plan">
                      <select name="tipo_plan_id" value={formPlan.tipo_plan_id} onChange={handleChangePlan} className={inputCls}>
                        <option value="">Seleccionar tipo…</option>
                        {tiposPlan.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                      {tipoPlanSeleccionado && (
                        <p className="mt-1.5 text-[11px] text-blue-600 font-semibold">✓ {tipoPlanSeleccionado.label}</p>
                      )}
                    </Field>

                    <Field label="Ingresos disponibles">
                      <input type="number" min="0" name="ingresos_disponibles" value={formPlan.ingresos_disponibles} onChange={handleChangePlan} className={inputCls} />
                    </Field>

                    <Field label="Fecha inicio">
                      <input type="date" name="fecha_inicio" value={formPlan.fecha_inicio} onChange={handleChangePlan} className={inputCls} />
                    </Field>

                    <Field label="Fecha fin">
                      <input type="date" name="fecha_fin" value={formPlan.fecha_fin} onChange={handleChangePlan} className={inputCls} />
                    </Field>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="submit"
                      disabled={guardandoPlan || !alumno || !planOriginal}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-500 transition disabled:opacity-50"
                    >
                      <Save size={14} />
                      {guardandoPlan ? "Guardando…" : "Guardar cambios"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}

        {/* ════════════ TAB: PERSONA ════════════ */}
        {alumno && tab === TAB_PERSONA && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Editar datos personales</span>
              {dniCambia && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                  <AlertTriangle size={11} />
                  El DNI cambiará
                </span>
              )}
            </div>
            <form onSubmit={handleGuardarPersona} className="p-4">
              <div className="grid gap-4 sm:grid-cols-2">

                <Field label="Nombre *">
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text" name="nombre"
                      value={formPersona.nombre} onChange={handleChangePersona}
                      className={`${inputCls} pl-9`}
                      placeholder="Nombre"
                    />
                  </div>
                </Field>

                <Field label="Apellido *">
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text" name="apellido"
                      value={formPersona.apellido} onChange={handleChangePersona}
                      className={`${inputCls} pl-9`}
                      placeholder="Apellido"
                    />
                  </div>
                </Field>

                <Field label="DNI *">
                  <div className="relative">
                    <IdCard size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text" name="documento"
                      value={formPersona.documento} onChange={handleChangePersona}
                      className={`${inputCls} pl-9 ${dniCambia ? "border-amber-300 focus:border-amber-400 focus:ring-amber-300" : ""}`}
                      placeholder="Número de documento"
                    />
                  </div>
                  {dniCambia && (
                    <p className="mt-1 text-[11px] text-amber-600">
                      DNI actual: {alumno.documento} → nuevo: {formPersona.documento}
                    </p>
                  )}
                </Field>

                <Field label="Fecha de nacimiento">
                  <input
                    type="date" name="fecha_nacimiento"
                    value={formPersona.fecha_nacimiento} onChange={handleChangePersona}
                    className={inputCls}
                  />
                </Field>

                <Field label="Celular">
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text" name="celular"
                      value={formPersona.celular} onChange={handleChangePersona}
                      className={`${inputCls} pl-9`}
                      placeholder="Ej: 3705001122"
                    />
                  </div>
                </Field>

                <Field label="Celular de emergencia">
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text" name="celular_emergencia"
                      value={formPersona.celular_emergencia} onChange={handleChangePersona}
                      className={`${inputCls} pl-9`}
                      placeholder="Contacto de emergencia"
                    />
                  </div>
                </Field>

                <Field label="Email">
                  <div className="relative sm:col-span-2">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email" name="email"
                      value={formPersona.email} onChange={handleChangePersona}
                      className={`${inputCls} pl-9`}
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                </Field>

              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={guardandoPersona}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-500 transition disabled:opacity-50"
                >
                  <Save size={14} />
                  {guardandoPersona ? "Guardando…" : "Guardar datos personales"}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

      {/* ── MODAL CONFIRMACIÓN PLAN ── */}
      <ConfirmarActualizacionPlanModal
        abierto={mostrarModalPlan}
        alumno={alumno}
        form={formPlan}
        tipoPlanSeleccionado={tipoPlanSeleccionado}
        guardando={guardandoPlan}
        onCancelar={() => setMostrarModalPlan(false)}
        onConfirmar={confirmarGuardadoPlan}
      />

      {/* ── CONFIRM DIALOG: DATOS PERSONALES ── */}
      <ConfirmDialog
        open={mostrarConfirmPersona}
        variant="primary"
        icon={User}
        title="¿Confirmar cambios?"
        message={
          dniCambia
            ? `Se actualizarán los datos de ${formPersona.apellido} ${formPersona.nombre}. El DNI cambiará de ${alumno?.documento} a ${formPersona.documento}.`
            : `Se actualizarán los datos personales de ${formPersona.apellido} ${formPersona.nombre}.`
        }
        confirmLabel="Guardar cambios"
        cancelLabel="Cancelar"
        loading={guardandoPersona}
        onConfirm={confirmarGuardadoPersona}
        onClose={() => setMostrarConfirmPersona(false)}
      />
    </div>
  );
}

// ── sub-componentes ──────────────────────────────────────────────
function TabBtn({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
        active
          ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function InfoTile({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
      <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {icon}{label}
      </div>
      <p className="mt-1 text-sm font-semibold text-slate-800 leading-tight">{value}</p>
    </div>
  );
}
