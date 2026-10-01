import { useQuery } from "@tanstack/react-query";
import { getRecaudacionDetalleDia, getRecaudacionDiasDeMes, getRecaudacionMensualPorAnio } from "../api/recaudacion_api.js";
import { exigirOk } from "./consultas_utils.js";

export const recaudacionKeys = {
  todo: ["recaudacion"],
  mensual: (anio) => ["recaudacion", "mensual", anio],
  diaria: (anio, mes) => ["recaudacion", "dias", anio, mes],
  detalleDia: (anio, mes, dia) => ["recaudacion", "detalle-dia", anio, mes, dia],
};

export function useRecaudacionMensual(anio) {
  return useQuery({
    queryKey: recaudacionKeys.mensual(anio),
    queryFn: async () => exigirOk(await getRecaudacionMensualPorAnio(anio), "No se pudo cargar recaudación"),
  });
}

export function useRecaudacionDiaria(anio, mes) {
  return useQuery({
    queryKey: recaudacionKeys.diaria(anio, mes),
    queryFn: async () => exigirOk(await getRecaudacionDiasDeMes(anio, mes), "No se pudo cargar la recaudación del mes"),
    enabled: Boolean(anio && mes),
  });
}

export function useRecaudacionDetalleDia(anio, mes, dia) {
  return useQuery({
    queryKey: recaudacionKeys.detalleDia(anio, mes, dia),
    queryFn: async () => exigirOk(await getRecaudacionDetalleDia(anio, mes, dia), "No se pudo cargar el detalle del día"),
    enabled: Boolean(anio && mes && dia),
  });
}
