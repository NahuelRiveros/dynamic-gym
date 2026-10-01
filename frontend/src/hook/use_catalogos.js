import { useQuery } from "@tanstack/react-query";
import { getCatalogos } from "../api/catalogos_api.js";
import { exigirOk } from "./consultas_utils.js";

export const catalogosKeys = { todo: ["catalogos"] };

/**
 * Tipos de documento, sexos, tipos de persona, planes activos y categorías de producto. Casi no
 * cambian: 5 minutos en caché (las pantallas que los usan no vuelven a pedirlos). Editar un plan
 * los invalida (use_planes.js), así el plan nuevo aparece enseguida en los selects.
 */
export function useCatalogos() {
  const consulta = useQuery({
    queryKey: catalogosKeys.todo,
    queryFn: async () => exigirOk(await getCatalogos(), "No se pudieron cargar los catálogos"),
    staleTime: 5 * 60 * 1000,
  });

  // Mismos nombres de siempre (data, loading, error) más los de TanStack Query.
  return { ...consulta, loading: consulta.isPending, error: consulta.error };
}
