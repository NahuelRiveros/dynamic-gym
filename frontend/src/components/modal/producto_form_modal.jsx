import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BellOff, BellRing, Info } from "lucide-react";
import InputField from "../form/input_field.jsx";
import SelectField from "../form/select_field.jsx";
import Ayuda from "../ui/ayuda.jsx";
import Modal from "../ui/modal.jsx";
import BotonesModal from "../ui/botones_modal.jsx";
import ListaErrores from "../ui/lista_errores.jsx";

// Mismas reglas que el servidor (stock_validators). "Sin aviso" se guarda como stock mínimo 0:
// el aviso es stock_actual < stock_minimo, así que con 0 nunca aparece.
const esquema = z
  .object({
    nombre: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres"),
    categoria_id: z.number().optional(),
    precio_venta: z.string().trim().min(1, "Ingresá el precio de venta (puede ser 0)"),
    avisar: z.boolean(),
    stock_minimo: z.string().trim(),
  })
  .superRefine((form, ctx) => {
    const precio = Number(form.precio_venta);
    if (form.precio_venta && (Number.isNaN(precio) || precio < 0))
      ctx.addIssue({ code: "custom", path: ["precio_venta"], message: "El precio debe ser un número mayor o igual a 0" });

    if (!form.avisar) return;
    const minimo = Number(form.stock_minimo);
    if (!Number.isInteger(minimo) || minimo < 1)
      ctx.addIssue({
        code: "custom",
        path: ["stock_minimo"],
        message: "Poné 1 o más unidades. Si no querés aviso, destildá la casilla.",
      });
  })
  .transform((form) => ({
    nombre: form.nombre,
    categoria_id: form.categoria_id ?? null,
    precio_venta: Number(form.precio_venta),
    stock_minimo: form.avisar ? Number(form.stock_minimo) : 0,
  }));

const desdeProducto = (producto) => ({
  nombre: producto?.nombre ?? "",
  categoria_id: producto?.categoria_id ?? undefined,
  precio_venta: producto ? String(Number(producto.precio_venta)) : "",
  avisar: Number(producto?.stock_minimo ?? 0) > 0,
  stock_minimo: Number(producto?.stock_minimo ?? 0) > 0 ? String(producto.stock_minimo) : "",
});

function QuePasa({ avisar, minimo, esEdicion }) {
  const n = Number(minimo);
  const conNumero = Number.isInteger(n) && n > 0;
  return (
    <div aria-live="polite" className="space-y-2 rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-sm text-slate-700">
      <p className="flex gap-2">
        {avisar ? (
          <BellRing aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        ) : (
          <BellOff aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        )}
        <span>
          {!avisar && "Este producto nunca va a mostrar el aviso de reponer. Las unidades se siguen contando igual."}
          {avisar && conNumero &&
            `Cuando queden menos de ${n} unidad${n === 1 ? "" : "es"}, el producto se marca "bajo" en la lista y suma en "Con stock bajo".`}
          {avisar && !conNumero && "Elegí desde cuántas unidades querés que te avise."}
        </span>
      </p>
      <p className="flex gap-2">
        <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <span>
          {esEdicion
            ? "Guardar no cambia las unidades en stock: para eso usá Reponer o Dar de baja en la lista."
            : "El producto se crea con 0 unidades. Para poder venderlo, cargá unidades con Reponer en la lista."}
        </span>
      </p>
    </div>
  );
}

// Se monta cada vez que se abre el modal: los valores iniciales salen del producto a editar.
function FormularioProducto({ productoEditar, categorias, onGuardar, onClose, cargando, errorServidor }) {
  const esEdicion = Boolean(productoEditar);
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: zodResolver(esquema),
    defaultValues: desdeProducto(productoEditar),
  });
  const [avisar, minimo] = useWatch({ control, name: ["avisar", "stock_minimo"] });

  return (
    <form onSubmit={handleSubmit(onGuardar)} className="space-y-4" noValidate>
      <InputField
        label="Nombre"
        name="nombre"
        register={register}
        error={errors.nombre?.message}
        placeholder="Ej: Agua mineral 500 ml"
        helperText="Así aparece al vender. Incluí marca o tamaño si tenés varios parecidos."
        autoComplete="off"
      />

      <SelectField
        label="Categoría (opcional)"
        name="categoria_id"
        register={register}
        asNumber
        options={categorias}
        placeholder="Sin categoría"
        ayuda="Solo sirve para ordenar y encontrar productos más rápido (ej: Bebidas, Suplementos). No cambia el precio ni el stock."
      />

      <InputField
        label="Precio de venta"
        name="precio_venta"
        register={register}
        error={errors.precio_venta?.message}
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        placeholder="Ej: 1500"
        ayuda="Lo que paga el cliente por unidad. Si después lo cambiás, las ventas ya hechas guardan el precio con el que se vendieron."
      />

      <fieldset className="space-y-3 rounded-xl border border-slate-200 p-3">
        <legend className="flex items-center gap-1 px-1 text-sm font-semibold text-gray-700">
          Aviso de reponer
          <Ayuda
            etiqueta="Ayuda: aviso de reponer"
            texto="Es opcional. Si lo activás, el sistema te marca el producto cuando quedan pocas unidades para que sepas que hay que comprar más. Si no, el producto se vende igual, solo que sin aviso."
          />
        </legend>

        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-700">
          <input type="checkbox" {...register("avisar")} className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-blue-600" />
          <span>Avisarme cuando quede poco stock</span>
        </label>

        {avisar && (
          <InputField
            label="Stock mínimo"
            name="stock_minimo"
            register={register}
            error={errors.stock_minimo?.message}
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            placeholder="Ej: 5"
            helperText="Unidades por debajo de las cuales se avisa."
          />
        )}
      </fieldset>

      <QuePasa avisar={avisar} minimo={minimo} esEdicion={esEdicion} />

      <ListaErrores errores={errorServidor ? [errorServidor] : []} />
      <BotonesModal onCancelar={onClose} ocupado={cargando} textoConfirmar={esEdicion ? "Guardar cambios" : "Crear producto"} />
    </form>
  );
}

export default function ProductoFormModal({ abierto, onClose, onGuardar, productoEditar = null, categorias = [], cargando = false, errorServidor = null }) {
  return (
    <Modal
      abierto={abierto}
      onCerrar={onClose}
      titulo={productoEditar ? "Editar producto" : "Nuevo producto"}
      descripcion={productoEditar ? productoEditar.nombre : "Cargá lo que se vende en el gimnasio: bebidas, suplementos, accesorios..."}
      ocupado={cargando}
    >
      <FormularioProducto productoEditar={productoEditar} categorias={categorias} onGuardar={onGuardar} onClose={onClose} cargando={cargando} errorServidor={errorServidor} />
    </Modal>
  );
}
