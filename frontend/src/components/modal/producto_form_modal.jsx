import { useState } from "react";
import Modal from "../ui/modal.jsx";
import BotonesModal from "../ui/botones_modal.jsx";
import ListaErrores from "../ui/lista_errores.jsx";

const CAMPO = "w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25";

const desdeProducto = (producto) => ({
  nombre: producto?.nombre || "",
  categoria_id: producto?.categoria_id ?? "",
  precio_venta: Number(producto?.precio_venta ?? 0),
  stock_minimo: producto?.stock_minimo ?? 0,
});

function validar(form) {
  const errores = [];
  if (!form.nombre || form.nombre.trim().length < 2) errores.push("El nombre debe tener al menos 2 caracteres");
  if (Number.isNaN(Number(form.precio_venta)) || Number(form.precio_venta) < 0) errores.push("El precio debe ser un número mayor o igual a 0");
  if (!Number.isInteger(Number(form.stock_minimo)) || Number(form.stock_minimo) < 0) errores.push("El stock mínimo debe ser un entero mayor o igual a 0");
  return errores;
}

// Se monta cada vez que se abre el modal: los valores iniciales salen del producto a editar.
function FormularioProducto({ productoEditar, categorias, onGuardar, onClose, cargando, errorServidor }) {
  const [form, setForm] = useState(() => desdeProducto(productoEditar));
  const [errores, setErrores] = useState([]);

  function manejarCambio(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === "nombre" || value === "" ? value : Number(value) }));
  }

  async function submit(e) {
    e.preventDefault();
    const nuevos = validar(form);
    setErrores(nuevos);
    if (nuevos.length > 0) return;

    await onGuardar({
      nombre: form.nombre.trim(),
      categoria_id: form.categoria_id === "" ? null : Number(form.categoria_id),
      precio_venta: Number(form.precio_venta),
      stock_minimo: Number(form.stock_minimo),
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <label className="block text-sm font-medium text-slate-700">
        <span className="mb-1 block">Nombre</span>
        <input type="text" name="nombre" value={form.nombre} onChange={manejarCambio} className={CAMPO} placeholder="Ej: Agua mineral 500ml" />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        <span className="mb-1 block">Categoría (opcional)</span>
        <select name="categoria_id" value={form.categoria_id} onChange={manejarCambio} className={CAMPO}>
          <option value="">Sin categoría</option>
          {categorias.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </label>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          <span className="mb-1 block">Precio de venta</span>
          <input type="number" name="precio_venta" value={form.precio_venta} onChange={manejarCambio} className={CAMPO} min="0" step="0.01" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          <span className="mb-1 block">Stock mínimo (alerta)</span>
          <input type="number" name="stock_minimo" value={form.stock_minimo} onChange={manejarCambio} className={CAMPO} min="0" />
        </label>
      </div>

      <ListaErrores errores={errorServidor ? [...errores, errorServidor] : errores} />
      <BotonesModal onCancelar={onClose} ocupado={cargando} />
    </form>
  );
}

export default function ProductoFormModal({ abierto, onClose, onGuardar, productoEditar = null, categorias = [], cargando = false, errorServidor = null }) {
  return (
    <Modal abierto={abierto} onCerrar={onClose} titulo={productoEditar ? "Editar producto" : "Nuevo producto"} ocupado={cargando}>
      <FormularioProducto productoEditar={productoEditar} categorias={categorias} onGuardar={onGuardar} onClose={onClose} cargando={cargando} errorServidor={errorServidor} />
    </Modal>
  );
}
