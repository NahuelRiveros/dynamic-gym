import { useState } from "react";
import Modal from "../ui/modal.jsx";
import BotonesModal from "../ui/botones_modal.jsx";
import ListaErrores from "../ui/lista_errores.jsx";

const CAMPO = "w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25";

const desdePlan = (plan) => ({
  descripcion: plan?.descripcion || "",
  dias_totales: plan?.dias_totales ?? 30,
  ingresos: plan?.ingresos ?? 0,
  precio: Number(plan?.precio ?? 0),
});

function validar(form) {
  const errores = [];
  if (!form.descripcion || form.descripcion.trim().length < 3) errores.push("La descripción debe tener al menos 3 caracteres");
  // Igual que el servidor: un plan dura al menos 1 día. 0 ingresos = ilimitado.
  if (!Number.isInteger(Number(form.dias_totales)) || Number(form.dias_totales) < 1) errores.push("Los días totales deben ser un entero mayor a 0");
  if (!Number.isInteger(Number(form.ingresos)) || Number(form.ingresos) < 0) errores.push("Los ingresos deben ser un entero mayor o igual a 0 (0 = ilimitado)");
  if (Number.isNaN(Number(form.precio)) || Number(form.precio) < 0) errores.push("El precio debe ser un número mayor o igual a 0");
  return errores;
}

// Se monta cada vez que se abre el modal: los valores iniciales salen del plan a editar.
function FormularioPlan({ planEditar, onGuardar, onClose, cargando, errorServidor }) {
  const [form, setForm] = useState(() => desdePlan(planEditar));
  const [errores, setErrores] = useState([]);

  function manejarCambio(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === "descripcion" || value === "" ? value : Number(value) }));
  }

  async function submit(e) {
    e.preventDefault();
    const nuevos = validar(form);
    setErrores(nuevos);
    if (nuevos.length > 0) return;

    await onGuardar({
      descripcion: form.descripcion.trim(),
      dias_totales: Number(form.dias_totales),
      ingresos: Number(form.ingresos),
      precio: Number(form.precio),
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <label className="block text-sm font-medium text-slate-700">
        <span className="mb-1 block">Descripción</span>
        <input type="text" name="descripcion" value={form.descripcion} onChange={manejarCambio} className={CAMPO} placeholder="Ej: Mensual 3 días por semana" />
      </label>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <label className="block text-sm font-medium text-slate-700">
          <span className="mb-1 block">Días totales</span>
          <input type="number" name="dias_totales" value={form.dias_totales} onChange={manejarCambio} className={CAMPO} min="1" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          <span className="mb-1 block">Ingresos</span>
          <input type="number" name="ingresos" value={form.ingresos} onChange={manejarCambio} className={CAMPO} min="0" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          <span className="mb-1 block">Precio</span>
          <input type="number" name="precio" value={form.precio} onChange={manejarCambio} className={CAMPO} min="0" step="0.01" />
        </label>
      </div>

      {/* El error del servidor (ej. descripción repetida) se ve acá, no detrás del modal. */}
      <ListaErrores errores={errorServidor ? [...errores, errorServidor] : errores} />
      <BotonesModal onCancelar={onClose} ocupado={cargando} />
    </form>
  );
}

export default function PlanFormModal({ abierto, onClose, onGuardar, planEditar = null, cargando = false, errorServidor = null }) {
  return (
    <Modal abierto={abierto} onCerrar={onClose} titulo={planEditar ? "Editar plan" : "Nuevo plan"} ocupado={cargando}>
      <FormularioPlan planEditar={planEditar} onGuardar={onGuardar} onClose={onClose} cargando={cargando} errorServidor={errorServidor} />
    </Modal>
  );
}
