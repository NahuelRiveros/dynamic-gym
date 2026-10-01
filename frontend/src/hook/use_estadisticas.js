import { useQuery } from "@tanstack/react-query";
import { getAlumnosNuevos, getHeatmapAsistencias, getPlanesPopulares, getVencimientos } from "../api/estadisticas_api.js";
import { exigirOk } from "./consultas_utils.js";

export const estadisticasKeys = {
  todo: ["estadisticas"],
  alumnosNuevos: (filtros) => ["estadisticas", "alumnos-nuevos", filtros],
  vencimientos: (dias) => ["estadisticas", "vencimientos", dias],
  heatmap: (filtros) => ["estadisticas", "heatmap", filtros],
  planesPopulares: (anio) => ["estadisticas", "planes-populares", anio],
};

export function useAlumnosNuevos(filtros) {
  return useQuery({
    queryKey: estadisticasKeys.alumnosNuevos(filtros),
    queryFn: async () => exigirOk(await getAlumnosNuevos(filtros), "No se pudo cargar alumnos nuevos"),
  });
}

export function useVencimientos(dias) {
  return useQuery({
    queryKey: estadisticasKeys.vencimientos(dias),
    queryFn: async () => exigirOk(await getVencimientos({ dias }), "No se pudo cargar vencimientos"),
  });
}

export function useHeatmapAsistencias(filtros) {
  return useQuery({
    queryKey: estadisticasKeys.heatmap(filtros),
    queryFn: async () => exigirOk(await getHeatmapAsistencias(filtros), "No se pudo cargar el heatmap"),
  });
}

export function usePlanesPopulares(anio) {
  return useQuery({
    queryKey: estadisticasKeys.planesPopulares(anio),
    queryFn: async () => exigirOk(await getPlanesPopulares({ anio }), "No se pudo cargar la popularidad de planes"),
  });
}
