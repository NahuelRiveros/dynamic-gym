import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { actualizarEstadosAlumnos, getAlumnoDetalle, getAlumnosListado } from "../api/alumnos_api.js";
import { exigirOk } from "./consultas_utils.js";

export const alumnosKeys = {
  todo: ["alumnos"],
  listado: (params) => ["alumnos", "listado", params],
  detalle: (id) => ["alumnos", "detalle", String(id)],
};

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

/** Recalcula los estados (habilitado / restringido) y vuelve a pedir todo lo de alumnos. */
export function useActualizarEstados() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: actualizarEstadosAlumnos,
    onSettled: () => queryClient.invalidateQueries({ queryKey: alumnosKeys.todo }),
  });
}
