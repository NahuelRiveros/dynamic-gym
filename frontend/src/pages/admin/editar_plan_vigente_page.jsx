import { useEffect, useMemo, useState } from "react";
import {
  buscarPlanVigente,
  actualizarPlanVigente,
} from "../../api/admin_alumnos_api";
import { getCatalogos } from "../../api/catalogos_api";
import SubmitButton from "../../components/form/submit_button";
import ConfirmarActualizacionPlanModal from "../../components/modal/confirmar_plan_modal.jsx";
import {
  hoyISO,
  fechaAR,
  money,
  estadoBadge,
  validarFormularioPlan,
  mapearPlanAForm,
} from "../../components/utils/editar_plan_helpers.js";

export default function EditarPlanVigentePage() {
  const [documento, setDocumento] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [tiposPlan, setTiposPlan] = useState([]);
  const [alumno, setAlumno] = useState(null);
  const [planOriginal, setPlanOriginal] = useState(null);
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] =
    useState(false);

  const [form, setForm] = useState({
    tipo_plan_id: "",
    fecha_inicio: hoyISO(),
    fecha_fin: hoyISO(),
    ingresos_disponibles: "",
  });

  useEffect(() => {
    async function cargarCatalogos() {
      try {
        const data = await getCatalogos();
        console.log("CATALOGOS:", data);
        setTiposPlan(data?.tiposPlan || []);
      } catch (e) {
        console.error("Error cargando tipos de plan:", e);
      }
    }

    cargarCatalogos();
  }, []);

  useEffect(() => {
    console.log("TIPOS PLAN:", tiposPlan);
  }, [tiposPlan]);

  function limpiarMensajes() {
    setError("");
    setMensaje("");
  }

  function limpiarResultado() {
    setAlumno(null);
    setPlanOriginal(null);
    setForm({
      tipo_plan_id: "",
      fecha_inicio: hoyISO(),
      fecha_fin: hoyISO(),
      ingresos_disponibles: "",
    });
  }

  async function handleBuscar(e) {
    e.preventDefault();
    limpiarMensajes();
    limpiarResultado();

    const doc = String(documento).replace(/[.\s]/g, "").trim();

    if (!doc) {
      setError("Ingresá un DNI");
      return;
    }

    try {
      setBuscando(true);

      const r = await buscarPlanVigente(doc);

      setAlumno(r.alumno || null);
      setPlanOriginal(r.plan || null);
      setForm(mapearPlanAForm(r.plan));
    } catch (e) {
      setError(
        e?.response?.data?.mensaje || "No se pudo buscar el plan vigente"
      );
    } finally {
      setBuscando(false);
    }
  }

  async function refrescarBusquedaActual() {
    const doc = String(documento).replace(/[.\s]/g, "").trim();
    if (!doc) return;

    const r = await buscarPlanVigente(doc);

    setAlumno(r.alumno || null);
    setPlanOriginal(r.plan || null);
    setForm(mapearPlanAForm(r.plan));
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleGuardar(e) {
    e.preventDefault();
    limpiarMensajes();

    const errorValidacion = validarFormularioPlan({ documento, form });

    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    setMostrarModalConfirmacion(true);
  }

  async function confirmarGuardado() {
    try {
      setGuardando(true);
      limpiarMensajes();

      const doc = String(documento).replace(/[.\s]/g, "").trim();

      const payload = {
        documento: doc,
        tipo_plan_id: Number(form.tipo_plan_id),
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin,
        ingresos_disponibles:
          form.ingresos_disponibles === ""
            ? null
            : Number(form.ingresos_disponibles),
      };

      const r = await actualizarPlanVigente(payload);

      setMensaje(r?.mensaje || "Plan actualizado correctamente");
      setMostrarModalConfirmacion(false);

      await refrescarBusquedaActual();
    } catch (e) {
      setError(e?.response?.data?.mensaje || "No se pudo actualizar el plan");
      setMostrarModalConfirmacion(false);
    } finally {
      setGuardando(false);
    }
  }

  const tipoPlanSeleccionado = useMemo(() => {
    return tiposPlan.find(
      (x) => Number(x.value) === Number(form.tipo_plan_id)
    );
  }, [tiposPlan, form.tipo_plan_id]);

  const badgeEstado = estadoBadge(alumno?.estado_desc);

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      <div className="rounded-2xl bg-white p-6 shadow-md">
        <h1 className="text-2xl font-bold text-gray-800">
          Editar plan vigente
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Buscá al alumno por DNI, revisá su estado actual y actualizá su plan.
        </p>

        <form
          onSubmit={handleBuscar}
          className="mt-6 flex flex-col gap-3 md:flex-row"
        >
          <input
            type="text"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
            placeholder="Ingresar DNI"
            className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            disabled={buscando}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {buscando ? "Buscando..." : "Buscar"}
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {mensaje && (
          <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-green-700">
            {mensaje}
          </div>
        )}

        {alumno && (
          <div className="mt-6 rounded-2xl border bg-gray-50 p-5">
            <h2 className="text-lg font-semibold text-gray-800">
              Alumno encontrado
            </h2>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border bg-white p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">
                  Alumno
                </div>
                <div className="mt-1 text-lg font-bold text-gray-800">
                  {alumno.nombre} {alumno.apellido}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <b>DNI:</b> {alumno.documento}
                </div>
                <div className="text-sm text-gray-600">
                  <b>ID Alumno:</b> {alumno.alumno_id}
                </div>
              </div>

              <div className="rounded-xl border bg-white p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">
                  Estado actual
                </div>
                <div className="mt-3">
                  <span className={badgeEstado.className}>
                    {badgeEstado.texto}
                  </span>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  <b>ID Estado:</b> {alumno.estado_id}
                </div>
              </div>
            </div>
          </div>
        )}

        {planOriginal && (
          <>
            <div className="mt-6 rounded-2xl border bg-blue-50 p-5">
              <h2 className="text-lg font-semibold text-gray-800">
                Plan actual cargado
              </h2>

              <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border bg-white p-4">
                  <div className="text-xs uppercase tracking-wide text-gray-500">
                    Tipo de plan
                  </div>
                  <div className="mt-1 font-semibold text-gray-800">
                    {planOriginal.tipo_plan || "—"}
                  </div>
                </div>

                <div className="rounded-xl border bg-white p-4">
                  <div className="text-xs uppercase tracking-wide text-gray-500">
                    Vigencia
                  </div>
                  <div className="mt-1 font-semibold text-gray-800">
                    {fechaAR(planOriginal.inicio)} → {fechaAR(planOriginal.fin)}
                  </div>
                </div>

                <div className="rounded-xl border bg-white p-4">
                  <div className="text-xs uppercase tracking-wide text-gray-500">
                    Ingresos disponibles
                  </div>
                  <div className="mt-1 font-semibold text-gray-800">
                    {planOriginal.ingresos_disponibles ?? "—"}
                  </div>
                </div>

                <div className="rounded-xl border bg-white p-4">
                  <div className="text-xs uppercase tracking-wide text-gray-500">
                    Monto pagado
                  </div>
                  <div className="mt-1 font-semibold text-gray-800">
                    {money(planOriginal.monto_pagado)}
                  </div>
                </div>

                <div className="rounded-xl border bg-white p-4">
                  <div className="text-xs uppercase tracking-wide text-gray-500">
                    Método de pago
                  </div>
                  <div className="mt-1 font-semibold text-gray-800">
                    {planOriginal.metodo_pago || "—"}
                  </div>
                </div>

                <div className="rounded-xl border bg-white p-4">
                  <div className="text-xs uppercase tracking-wide text-gray-500">
                    ID de plan
                  </div>
                  <div className="mt-1 font-semibold text-gray-800">
                    {planOriginal.fecha_id}
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleGuardar} className="mt-6 space-y-4">
              <div className="rounded-2xl border bg-white p-5">
                <h2 className="text-lg font-semibold text-gray-800">
                  Editar plan
                </h2>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Tipo de plan
                    </label>
                    <select
                      name="tipo_plan_id"
                      value={form.tipo_plan_id}
                      onChange={handleChange}
                      className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar</option>
                      {tiposPlan.map((plan) => (
                        <option key={plan.value} value={plan.value}>
                          {plan.label}
                        </option>
                      ))}
                    </select>

                    {tipoPlanSeleccionado && (
                      <p className="mt-2 text-xs text-gray-500">
                        Seleccionado: {tipoPlanSeleccionado.label}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Ingresos disponibles
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="ingresos_disponibles"
                      value={form.ingresos_disponibles}
                      onChange={handleChange}
                      className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Fecha inicio
                    </label>
                    <input
                      type="date"
                      name="fecha_inicio"
                      value={form.fecha_inicio}
                      onChange={handleChange}
                      className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Fecha fin
                    </label>
                    <input
                      type="date"
                      name="fecha_fin"
                      value={form.fecha_fin}
                      onChange={handleChange}
                      className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <SubmitButton
                    type="submit"
                    label={guardando ? "Guardando..." : "Guardar cambios"}
                    disabled={guardando || !alumno || !planOriginal}
                  />
                </div>
              </div>
            </form>
          </>
        )}
      </div>

      <ConfirmarActualizacionPlanModal
        abierto={mostrarModalConfirmacion}
        alumno={alumno}
        form={form}
        tipoPlanSeleccionado={tipoPlanSeleccionado}
        guardando={guardando}
        onCancelar={() => setMostrarModalConfirmacion(false)}
        onConfirmar={confirmarGuardado}
      />
    </div>
  );
}