import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import PagoSuccessModal from "../components/modal/pago_success_modal.jsx";
import { getCatalogos } from "../api/catalogos_api";
import { registrarPago, previewPago } from "../api/pagos_api";

// ✅ tus componentes reutilizables
import FormCard from "../components/form/form_card";
import FormError from "../components/form/form_error";
import InputField from "../components/form/input_field";
import SelectField from "../components/form/select_field";
import SubmitButton from "../components/form/submit_button";
import { formatearFechaAR } from "../components/form/formatear_fecha.js";

export default function RegistrarPagoPage() {
  const [planes, setPlanes] = useState([]);
  const [cargandoPlanes, setCargandoPlanes] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [okMsg, setOkMsg] = useState(null);

  const [alumno, setAlumno] = useState(null);
  const [planVigente, setPlanVigente] = useState(null);

  // ✅ modal
  const [modalOpen, setModalOpen] = useState(false);
  const [ultimoPago, setUltimoPago] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      documento: "",
      tipo_plan_id: "",
      monto_pagado: "",
      metodo_pago: "EFECTIVO",
    },
  });

  const documento = watch("documento");

  function limpiarMensajes() {
    setError(null);
    setOkMsg(null);
  }

  function limpiarFormularioCompleto() {
    setAlumno(null);
    setPlanVigente(null);
    setValue("documento", "");
    setValue("tipo_plan_id", "");
    setValue("monto_pagado", "");
    setValue("metodo_pago", "EFECTIVO");
  }

  async function cargarPlanes() {
    setCargandoPlanes(true);
    try {
      const r = await getCatalogos();
      if (r?.ok) {
        setPlanes(Array.isArray(r.tiposPlan) ? r.tiposPlan : []);
      } else {
        setPlanes([]);
      }
    } catch {
      setPlanes([]);
    } finally {
      setCargandoPlanes(false);
    }
  }

  useEffect(() => {
    cargarPlanes();
  }, []);

  // ✅ Buscar alumno primero
  async function buscarAlumno() {
    limpiarMensajes();
    setAlumno(null);
    setPlanVigente(null);

    const doc = String(documento ?? "").replace(/[.\s]/g, "").trim();
    if (!doc || !/^\d+$/.test(doc)) {
      setError("DNI inválido (solo números)");
      return;
    }

    setCargando(true);
    try {
      const r = await previewPago(doc);
      if (!r?.ok) {
        setError(r?.mensaje || "No se pudo buscar el alumno");
        return;
      }
      console.log(r)

      setAlumno(r.alumno);
      setPlanVigente(r.ultimo_pago || null);
      setOkMsg("Alumno encontrado. Verificá y registrá el pago.");
      setValue("documento", doc);
    } catch (e) {
      setError(
        e?.response?.data?.mensaje || e?.message || "Error buscando alumno"
      );
    } finally {
      setCargando(false);
    }
  }

  // ✅ Registrar pago (solo si hay alumno confirmado)
  async function onSubmit(values) {
    limpiarMensajes();
    console.log("metodo_pago raw:", values.metodo_pago, typeof values.metodo_pago);


    if (!alumno?.alumno_id) {
      setError("Primero buscá y confirmá el alumno por DNI.");
      return;
    }

    const doc = String(values.documento ?? "").replace(/[.\s]/g, "").trim();
    const monto = Number(values.monto_pagado);

    if (!doc || !/^\d+$/.test(doc)) {
      setError("DNI inválido (solo números)");
      return;
    }
    if (!values.tipo_plan_id) {
      setError("Seleccioná un plan");
      return;
    }
    if (!Number.isFinite(monto) || monto <= 0) {
      setError("Monto inválido");
      return;
    }
    if (!String(values.metodo_pago ?? "").trim()) {
      setError("Método de pago obligatorio");
      return;
    }

    setCargando(true);
    try {
      const r = await registrarPago({
        documento: doc,
        tipo_plan_id: Number(values.tipo_plan_id),
        monto_pagado: monto,
        metodo_pago: String(values.metodo_pago).trim(),
      });

      if (!r?.ok) {
        setError(r?.mensaje || "No se pudo registrar el pago");
        return;
      }

      // ✅ guardar resultado y abrir modal
      setUltimoPago(r);
      setModalOpen(true);

      // ✅ limpiar formulario (modo seguro: limpiar TODO)
      limpiarFormularioCompleto();
      setOkMsg(null);
    } catch (e) {
      setError(e?.response?.data?.mensaje || e?.message || "Error inesperado");
    } finally {
      setCargando(false);
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-4 flex justify-center items-start">
        <FormCard
          titulo="Registrar pago"
          subtitulo="Primero buscá al alumno por DNI. Luego registrá el pago."
        >
          <div className="space-y-3">
            <FormError message={error} />
            {okMsg ? (
              <div className="rounded-xl bg-green-50 p-3 text-sm text-green-700 text-center">
                {okMsg}
              </div>
            ) : null}
          </div>

          {/* ✅ BUSQUEDA ALUMNO */}
          <div className="mt-5 flex flex-col gap-3 justify-center items-center">
            <InputField
              label="DNI"
              name="documento"
              register={register}
              error={errors.documento?.message}
              placeholder="Ej: 35123456"
              inputMode="numeric"
              autoComplete="off"
              className="font-bold text-2xl tracking-wide text-gray-800 text-center"
            />

            <SubmitButton
              type="button"
              onClick={buscarAlumno}
              loading={cargando}
              label="Buscar alumno"
              loadingLabel="Buscando..."
              className="w-40 "
            />
          </div>

          {/* ✅ Preview alumno */}
          {alumno && (
            <div className="mt-5 rounded-2xl border bg-white p-4">
              <div className="text-sm font-semibold text-gray-700">Alumno</div>
              <div className="mt-1 text-lg font-extrabold">
                {alumno.apellido} {alumno.nombre}
              </div>
              <div className="mt-1 text-sm text-gray-600">
                DNI: {alumno.documento} · Estado:{" "}
                <b>{alumno.estado_desc || alumno.estado_id}</b>
              </div>

              <div className="mt-3 text-sm">
                {planVigente ? (
                  <div className="rounded-xl border p-3">
                    <div>
                      <b>Plan vigente:</b> {planVigente.tipo_desc || "—"}
                    </div>
                    <div>
                      <b>Vence:</b> {formatearFechaAR(planVigente.fin)}
                    </div>
                    <div>
                      <b>Ingresos:</b> {planVigente.ingresos_disponibles ?? "—"}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-600">Sin plan vigente.</div>
                )}
              </div>
            </div>
          )}

          {/* ✅ FORM PAGO */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-5 flex flex-col  grid-cols-1 gap-3 " 
          >
            <SelectField
              label="Plan"
              name="tipo_plan_id"
              register={register}
              error={errors.tipo_plan_id?.message}
              options={planes} // [{value,label,...}]
              placeholder="Seleccionar plan..."
              disabledVisual={!alumno}
            />

            {!planes.length && (
              <p className="text-xs text-gray-500">
                No hay planes cargados (revisá /catalogos -&gt; tiposPlan).
              </p>
            )}

            <InputField
              label="Monto pagado (ARS)"
              name="monto_pagado"
              register={register}
              error={errors.monto_pagado?.message}
              placeholder="Ej: 15000"
              inputMode="decimal"
            />

            <SelectField
              label="Método de pago"
              name="metodo_pago"
              register={register}
              options={[
                { value: "EFECTIVO", label: "Efectivo" },
                { value: "TRANSFERENCIA", label: "Transferencia" },
                { value: "DÉBITO", label: "Débito" },
                { value: "CRÉDITO", label: "Crédito" },
                { value: "MERCADO PAGO", label: "Mercado Pago" },
              ]}
              disabledVisual={!alumno}
              asNumber={false} // ✅ queda string sí o sí
            />
            <div className="flex flex-col gap-3 justify-center items-center">
                <SubmitButton
                  label={alumno ? "Registrar pago" : "Buscá un alumno primero"}
                  loading={cargando}
                  loadingLabel="Registrando..."
                  disabled={!alumno}
                  className="w-42"
                />

                <button
                  type="button "
                  className="w-24 rounded-xl border px-4 py-3 font-semibold"
                  onClick={() => {
                    limpiarMensajes();
                    limpiarFormularioCompleto();
                  }}
                >
                  Limpiar
                </button>

            </div>

            
          </form>
        </FormCard>
      </div>

      {/* ✅ MODAL ÉXITO */}
      <PagoSuccessModal
        open={modalOpen}
        persona={{
          nombre: ultimoPago?.alumno?.nombre,
          apellido: ultimoPago?.alumno?.apellido,
          documento: ultimoPago?.alumno?.documento,
        }}
        alumno={{ alumno_id: ultimoPago?.alumno?.alumno_id }}
        delayMs={4500}
        onFinish={() => {
          setModalOpen(false);
          setUltimoPago(null);
          limpiarMensajes();
        }}
      />
    </>
  );
}