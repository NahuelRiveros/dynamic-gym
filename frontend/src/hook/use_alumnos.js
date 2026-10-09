import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { actualizarEstadosAlumnos, consultarPlanPorDni, getAlumnoDetalle, getAlumnosCumples, getAlumnosListado, registrarAlumno } from "../api/alumnos_api.js";
import { exigirOk } from "./consultas_utils.js";

export const alumnosKeys = {
  todo: ["alumnos"],
  listado: (params) => ["alumnos", "listado", params],
  detalle: (id) => ["alumnos", "detalle", String(id)],
  cumples: (dias) => ["alumnos", "cumples", dias],
  planPublico: (dni) => ["alumnos", "plan-publico", dni],
};

/**
 * "Mi Plan" (pública): el plan de un DNI. Sin reintentos: un DNI que no existe responde 404 y
 * la ruta tiene límite de consultas por persona. Un minuto en caché: consultar dos veces
 * seguidas el mismo DNI no vuelve a despertar a Neon.
 */
export function usePlanPublico(dni) {
  return useQuery({
    queryKey: alumnosKeys.planPublico(dni),
    queryFn: async () => exigirOk(await consultarPlanPorDni(dni), "No se pudo consultar el plan"),
    enabled: Boolean(dni),
    retry: false,
    staleTime: 60 * 1000,
  });
}

/** Listado paginado en el servidor. Mientras llega la página nueva se sigue viendo la anterior. */
export function useListadoAlumnos(params) {
  return useQuery({
    queryKey: alumnosKeys.listado(params),
    queryFn: async () => exigirOk(await getAlumnosListado(params), "No se pudo cargar alumnos"),
    placeholderData: keepPreviousData,
  });
}

export function useDetalleAlumno(id) {
  return useQuery({
    queryKey: alumnosKeys.detalle(id),
    queryFn: async () => exigirOk(await getAlumnoDetalle(id), "No se pudo cargar el alumno"),
    enabled: Boolean(id),
  });
}

const UNA_HORA = 60 * 60 * 1000;

/**
 * Cumpleaños de hoy y de los próximos días (alertas del kiosco). Cambian una vez por día: se piden
 * cada hora. Antes era cada minuto y, con el kiosco abierto toda la noche, Neon no se dormía nunca.
 */
export function useCumples(dias) {
  return useQuery({
    queryKey: alumnosKeys.cumples(dias),
    queryFn: () => getAlumnosCumples({ dias }),
    staleTime: UNA_HORA,
    refetchInterval: UNA_HORA,
  });
}

/** Recalcula los estados (habilitado / restringido) y vuelve a pedir todo lo de alumnos. */
export function useActualizarEstados() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: actualizarEstadosAlumnos,
    onSettled: () => queryClient.invalidateQueries({ queryKey: alumnosKeys.todo }),
  });
}

/** Alta de un alumno nuevo. Las listas de alumnos se vuelven a pedir. */
export function useRegistrarAlumno() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (datos) => exigirOk(await registrarAlumno(datos), "No se pudo registrar al alumno"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: alumnosKeys.todo }),
  });
}
