import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import InputField from "../form/input_field.jsx";
import SelectField from "../form/select_field.jsx";
import Ayuda from "../ui/ayuda.jsx";
import Modal from "../ui/modal.jsx";
import BotonesModal from "../ui/botones_modal.jsx";
import ListaErrores from "../ui/lista_errores.jsx";
import ProductoQuePasa from "./producto_que_pasa.jsx";

// El aviso se guarda como stock mínimo (la lista marca "bajo" si stock < mínimo), sin tocar la base:
// "no" = 0 (nunca avisa), "agotado" = 1 (avisa en 0), "pocas" = el número que se elija (2 o más).
const MINIMO_DE = { no: () => 0, agotado: () => 1, pocas: (n) => Number(n) };
const AVISOS = [
  { value: "no", label: "No avisar" },
  { value: "agotado", label: "Avisar cuando se agote (0 unidades)" },
  { value: "pocas", label: "Avisar cuando queden pocas" },
];

const esEnteroDesde = (valor, desde) => Number.isInteger(Number(valor)) && Number(valor) >= desde;

// Mismas reglas que el servidor (stock_validators). El stock inicial solo existe al crear.
const crearEsquema = (esEdicion) =>
  z
    .object({
      nombre: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres"),
      categoria_id: z.number().optional(),
      precio_venta: z.string().trim().min(1, "Ingresá el precio de venta (puede ser 0)"),
      stock_inicial: z.string().trim(),
      aviso: z.enum(["no", "agotado", "pocas"]),
      stock_minimo: z.string().trim(),
    })
    .superRefine((form, ctx) => {
      const problema = (campo, message) => ctx.addIssue({ code: "custom", path: [campo], message });
      const precio = Number(form.precio_venta);
      if (form.precio_venta && (Number.isNaN(precio) || precio < 0)) problema("precio_venta", "El precio debe ser un número mayor o igual a 0");
      if (!esEdicion && form.stock_inicial && !esEnteroDesde(form.stock_inicial, 0))
        problema("stock_inicial", "Las unidades tienen que ser un número entero (0 o más)");
      if (form.aviso === "pocas" && !esEnteroDesde(form.stock_minimo, 2))
        problema("stock_minimo", 'Poné 2 o más. Para avisar recién al llegar a 0, elegí "Avisar cuando se agote".');
    })
    .transform((form) => ({
      nombre: form.nombre,
      categoria_id: form.categoria_id ?? null,
      precio_venta: Number(form.precio_venta),
      stock_minimo: MINIMO_DE[form.aviso](form.stock_minimo),
      ...(esEdicion ? {} : { stock_inicial: form.stock_inicial ? Number(form.stock_inicial) : 0 }),
    }));

function desdeProducto(producto) {
  const minimo = Number(producto?.stock_minimo ?? 0);
  return {
    nombre: producto?.nombre ?? "",
    categoria_id: producto?.categoria_id ?? undefined,
    precio_venta: producto ? String(Number(producto.precio_venta)) : "",
    stock_inicial: "",
    aviso: minimo === 0 ? "no" : minimo === 1 ? "agotado" : "pocas",
    stock_minimo: minimo > 1 ? String(minimo) : "",
  };
}

// Se monta cada vez que se abre el modal: los valores iniciales salen del producto a editar.
function FormularioProducto({ productoEditar, categorias, onGuardar, onClose, cargando, errorServidor }) {
  const esEdicion = Boolean(productoEditar);
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: zodResolver(crearEsquema(esEdicion)),
    defaultValues: desdeProducto(productoEditar),
  });
  const [aviso, minimo, stockInicial] = useWatch({ control, name: ["aviso", "stock_minimo", "stock_inicial"] });

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        {esEdicion ? (
          <div>
            <p className="text-sm font-semibold text-gray-700">Stock actual</p>
            <p className="mt-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700">
              {productoEditar.stock_actual ?? 0} unidades
            </p>
          </div>
        ) : (
          <InputField
            label="Stock inicial (opcional)"
            name="stock_inicial"
            register={register}
            error={errors.stock_inicial?.message}
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            placeholder="Ej: 24"
            ayuda="Las unidades que ya tenés en el gimnasio. Quedan en el historial como una reposición. Si lo dejás vacío, el producto arranca en 0 y las cargás después con Reponer."
          />
        )}
      </div>

      <fieldset className="space-y-2.5 rounded-xl border border-slate-200 p-3">
        <legend className="flex items-center gap-1 px-1 text-sm font-semibold text-gray-700">
          Aviso de reponer
          <Ayuda
            etiqueta="Ayuda: aviso de reponer"
            texto='Es opcional. Si avisás, el producto se marca en la lista y suma en "Con stock bajo" para que sepas que hay que comprar más. Sin aviso, el producto se vende igual.'
          />
        </legend>

        {AVISOS.map((opcion) => (
          <label key={opcion.value} className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
            <input type="radio" value={opcion.value} {...register("aviso")} className="h-4 w-4 accent-blue-600" />
            {opcion.label}
          </label>
        ))}

        {aviso === "pocas" && (
          <InputField
            label="Avisar con menos de"
            name="stock_minimo"
            register={register}
            error={errors.stock_minimo?.message}
            type="number"
            inputMode="numeric"
            min="2"
            step="1"
            placeholder="Ej: 5"
            helperText={
              esEnteroDesde(minimo, 2)
                ? `Unidades: se avisa cuando queden ${Number(minimo) - 1} o menos.`
                : "Unidades. Ej: con 5, se avisa cuando queden 4 o menos."
            }
            wrapperClassName="pl-6"
          />
        )}
      </fieldset>

      <ProductoQuePasa aviso={aviso} minimo={minimo} stockInicial={stockInicial} stockActual={esEdicion ? productoEditar.stock_actual ?? 0 : null} />

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
