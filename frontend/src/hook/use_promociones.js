import { useMutation, useQuery } from "@tanstack/react-query";
import { enviarPromocion, getPreviewDestinatarios } from "../api/promociones_api.js";

export const promocionesKeys = {
  preview: (filtro) => ["promociones", "preview", filtro],
};

/** Cuántos alumnos reciben el email con ese filtro, y una muestra de 5. */
export function usePreviewDestinatarios(filtro) {
  return useQuery({
    queryKey: promocionesKeys.preview(filtro),
    queryFn: () => getPreviewDestinatarios(filtro),
  });
}

export function useEnviarPromocion() {
  return useMutation({ mutationFn: enviarPromocion });
}
