import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { previewPago, registrarPago } from "../api/pagos_api.js";
import { alumnosKeys } from "./use_alumnos.js";
import { exigirOk } from "./consultas_utils.js";
import { estadisticasKeys } from "./use_estadisticas.js";
import { recaudacionKeys } from "./use_recaudacion.js";

export const pagosKeys = {
  todo: ["pagos"],
  preview: (dni) => ["pagos", "preview", dni],
};

/** El alumno y su último plan, antes de cobrarle. Sin reintentos: un DNI que no existe es un 404. */
export function usePreviewPago(dni) {
  return useQuery({
    queryKey: pagosKeys.preview(dni),
    queryFn: async () => exigirOk(await previewPago(dni), "No se pudo buscar al alumno"),
    enabled: Boolean(dni),
    retry: false,
  });
}

/** Cobrar un plan: cambia el estado del alumno, los vencimientos, la recaudación y su vista previa. */
export function useRegistrarPago() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (datos) => exigirOk(await registrarPago(datos), "No se pudo registrar el pago"),
    onSuccess: () => {
      for (const queryKey of [alumnosKeys.todo, estadisticasKeys.todo, recaudacionKeys.todo, pagosKeys.todo]) {
        queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}
