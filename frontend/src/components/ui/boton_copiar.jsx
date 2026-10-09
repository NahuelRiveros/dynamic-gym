import { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

/** Copia un texto al portapapeles y avisa "Copiado" un momento (también al lector de pantalla). */
export default function BotonCopiar({ texto, etiqueta }) {
  const [copiado, setCopiado] = useState(false);
  const timer = useRef(null);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(String(texto));
      setCopiado(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles: el texto igual está a la vista para copiarlo a mano.
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      aria-label={copiado ? `${etiqueta} copiado` : `Copiar ${etiqueta}`}
      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 transition outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-sky-400"
    >
      {copiado ? <Check aria-hidden="true" className="h-3.5 w-3.5 text-emerald-600" /> : <Copy aria-hidden="true" className="h-3.5 w-3.5" />}
      <span aria-live="polite">{copiado ? "Copiado" : "Copiar"}</span>
    </button>
  );
}
