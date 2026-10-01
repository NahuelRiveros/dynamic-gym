import { useSyncExternalStore } from "react";

/**
 * true mientras la pantalla cumple la media query (ej. "(max-width: 767px)") y se actualiza
 * al girar el celular o cambiar el tamaño de la ventana. Sin matchMedia (tests) devuelve false.
 */
export function useConsultaMedia(consulta) {
  return useSyncExternalStore(
    (avisar) => {
      const media = window.matchMedia?.(consulta);
      if (!media) return () => {};
      media.addEventListener("change", avisar);
      return () => media.removeEventListener("change", avisar);
    },
    () => window.matchMedia?.(consulta).matches ?? false,
  );
}
