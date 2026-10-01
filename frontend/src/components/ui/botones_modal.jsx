/** Pie de un modal: "Cancelar" y el botón principal (submit del formulario, o con onConfirmar). */
export default function BotonesModal({ onCancelar, onConfirmar, ocupado = false, textoConfirmar = "Guardar", textoOcupado = "Guardando...", peligro = false }) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button
        type="button"
        onClick={onCancelar}
        disabled={ocupado}
        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Cancelar
      </button>
      <button
        type={onConfirmar ? "button" : "submit"}
        onClick={onConfirmar}
        disabled={ocupado}
        className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${peligro ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}
      >
        {ocupado ? textoOcupado : textoConfirmar}
      </button>
    </div>
  );
}
