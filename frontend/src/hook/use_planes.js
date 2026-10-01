import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { actualizarPlan, cambiarEstadoPlan, crearPlan, obtenerPlanes } from "../api/planes_api.js";
import { catalogosKeys } from "./use_catalogos.js";
import { exigirOk } from "./consultas_utils.js";
import { estadisticasKeys } from "./use_estadisticas.js";

export const planesKeys = {
  todo: ["planes"],
  lista: () => ["planes", "lista"],
};

export function usePlanes() {
  return useQuery({
    queryKey: planesKeys.lista(),
    queryFn: async () => exigirOk(await obtenerPlanes(), "No se pudieron cargar los planes").data ?? [],
  });
}

// Un plan nuevo o editado cambia la lista, los catálogos (selects de pago y registro) y las estadísticas.
function invalidarPlanes(queryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: planesKeys.todo }),
    queryClient.invalidateQueries({ queryKey: catalogosKeys.todo }),
    queryClient.invalidateQueries({ queryKey: estadisticasKeys.todo }),
  ]);
}

/** Crea (sin id) o actualiza (con id) un plan. */
export function useGuardarPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }) => (id ? actualizarPlan(id, datos) : crearPlan(datos)),
    onSuccess: () => invalidarPlanes(queryClient),
  });
}

export function useCambiarEstadoPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, activo }) => cambiarEstadoPlan(id, activo),
    onSuccess: () => invalidarPlanes(queryClient),
  });
}
