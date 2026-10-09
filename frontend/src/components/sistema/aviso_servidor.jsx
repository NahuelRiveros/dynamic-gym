import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CloudOff, LoaderCircle } from "lucide-react";
import { verificarServidor } from "../../api/health.js";

// En Render (plan gratis) el servidor se duerme sin visitas y tarda ~30-50 s en despertar: si la
// primera respuesta demora más que esto, avisamos en vez de dejar la pantalla "colgada".
// /api/health no consulta la base, así que este aviso no despierta a Neon.
const DEMORA_AVISO_MS = 3000;
const REINTENTO_MS = 5000;

/** Aviso chico abajo de la pantalla cuando la API tarda en despertar o no responde. No bloquea nada. */
export default function AvisoServidor() {
  const salud = useQuery({
    queryKey: ["salud"],
    queryFn: verificarServidor,
    retry: false,
    staleTime: 60_000,
    // Solo se insiste mientras está caído; con el servidor bien no hay consultas de más.
    refetchInterval: (query) => (query.state.status === "error" ? REINTENTO_MS : false),
  });
  const [demora, setDemora] = useState(false);

  useEffect(() => {
    if (!salud.isPending) return;
    const id = setTimeout(() => setDemora(true), DEMORA_AVISO_MS);
    return () => clearTimeout(id);
  }, [salud.isPending]);

  const caido = salud.isError;
  const despertando = salud.isPending && demora;
  if (!caido && !despertando) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-[calc(1rem+var(--barra-inferior,0px)+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
    >
      {caido ? (
        <CloudOff className="h-6 w-6 shrink-0 text-red-600" aria-hidden="true" />
      ) : (
        <LoaderCircle className="h-6 w-6 shrink-0 animate-spin text-blue-600" aria-hidden="true" />
      )}
      <div className="text-sm">
        <p className="font-semibold text-slate-900">{caido ? "Sin conexión con el servidor" : "Despertando el servidor…"}</p>
        <p className="text-slate-600">
          {caido ? "Revisá la conexión a internet. Reintentamos solos cada pocos segundos." : "La primera carga del día puede tardar unos segundos."}
        </p>
      </div>
    </div>
  );
}
