import { BellOff, BellRing, Info, TriangleAlert } from "lucide-react";

const entero = (valor) => {
  const n = Number(valor);
  return valor !== "" && Number.isInteger(n) && n >= 0 ? n : null;
};

function Linea({ icono: Icono, color, children }) {
  return (
    <p className="flex gap-2">
      <Icono aria-hidden="true" className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />
      <span>{children}</span>
    </p>
  );
}

/**
 * Explica, mientras se completa el formulario, qué va a pasar con el producto: cuándo avisa y
 * con cuántas unidades queda. Mismo cálculo que la lista: "bajo" es stock < stock mínimo.
 */
export default function ProductoQuePasa({ aviso, minimo, stockInicial, stockActual = null }) {
  const n = entero(minimo);
  const unidades = stockActual ?? entero(stockInicial) ?? 0;
  const umbral = aviso === "agotado" ? 1 : aviso === "pocas" ? n : 0;
  const arrancaBajo = umbral > 0 && unidades < umbral;

  return (
    <div aria-live="polite" className="space-y-2 rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-sm text-slate-700">
      {aviso === "no" && (
        <Linea icono={BellOff} color="text-slate-400">
          Este producto nunca va a mostrar el aviso de reponer. Las unidades se siguen contando igual.
        </Linea>
      )}
      {aviso === "agotado" && (
        <Linea icono={BellRing} color="text-amber-500">
          Cuando se termine (0 unidades), el producto se marca &quot;agotado&quot; en la lista y suma en &quot;Con stock bajo&quot;.
        </Linea>
      )}
      {aviso === "pocas" && (
        <Linea icono={BellRing} color="text-amber-500">
          {n > 1
            ? `Cuando queden menos de ${n} unidades, el producto se marca "bajo" en la lista y suma en "Con stock bajo".`
            : "Elegí desde cuántas unidades querés que te avise."}
        </Linea>
      )}

      {stockActual === null ? (
        <Linea icono={Info} color="text-blue-500">
          {unidades > 0
            ? `Se crea con ${unidades} unidad${unidades === 1 ? "" : "es"}, registradas como reposición en el historial. Ya se puede vender.`
            : "Se crea con 0 unidades. Para poder venderlo, cargá unidades con Reponer en la lista."}
        </Linea>
      ) : (
        <Linea icono={Info} color="text-blue-500">
          Hoy hay {stockActual} unidad{stockActual === 1 ? "" : "es"}. Guardar no las cambia: para eso usá Reponer o Dar de baja en la lista.
        </Linea>
      )}

      {arrancaBajo && (
        <Linea icono={TriangleAlert} color="text-amber-600">
          Con {unidades} unidad{unidades === 1 ? "" : "es"} el producto ya {stockActual === null ? "arranca" : "queda"} marcado para reponer.
        </Linea>
      )}
    </div>
  );
}
