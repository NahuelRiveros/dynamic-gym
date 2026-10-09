import { useQuery } from "@tanstack/react-query";
import { getRecaudacionDetalleDia, getRecaudacionDiasDeMes, getRecaudacionMensualPorAnio } from "../api/recaudacion_api.js";
import { exigirOk } from "./consultas_utils.js";

export const recaudacionKeys = {
  todo: ["recaudacion"],
  mensual: (anio) => ["recaudacion", "mensual", anio],
  diaria: (anio, mes) => ["recaudacion", "dias", anio, mes],
  detalleDia: (anio, mes, dia) => ["recaudacion", "detalle-dia", anio, mes, dia],
};

// Vercel y Render no despliegan al mismo tiempo: si el servidor todavía es el de antes (sin
// separar planes y productos), el total se toma como planes y la pantalla no se rompe.
const conDesglose = (item) => ({ ...item, planes: item.planes ?? Number(item.total || 0), productos: item.productos ?? 0 });

export function useRecaudacionMensual(anio) {
  return useQuery({
    queryKey: recaudacionKeys.mensual(anio),
    queryFn: async () => exigirOk(await getRecaudacionMensualPorAnio(anio), "No se pudo cargar recaudación"),
    select: (data) => ({ ...data, items: (data.items ?? []).map(conDesglose) }),
  });
}

export function useRecaudacionDiaria(anio, mes) {
  return useQuery({
    queryKey: recaudacionKeys.diaria(anio, mes),
    queryFn: async () => exigirOk(await getRecaudacionDiasDeMes(anio, mes), "No se pudo cargar la recaudación del mes"),
    enabled: Boolean(anio && mes),
    select: (data) => ({ ...data, items: (data.items ?? []).map(conDesglose), metodos: data.metodos ?? [] }),
  });
}

export function useRecaudacionDetalleDia(anio, mes, dia) {
  return useQuery({
    queryKey: recaudacionKeys.detalleDia(anio, mes, dia),
    queryFn: async () => exigirOk(await getRecaudacionDetalleDia(anio, mes, dia), "No se pudo cargar el detalle del día"),
    enabled: Boolean(anio && mes && dia),
    select: (data) => ({
      ...data,
      ventas: data.ventas ?? [],
      metodos: data.metodos ?? [],
      total_planes: data.total_planes ?? Number(data.total_dia || 0),
      total_productos: data.total_productos ?? 0,
    }),
  });
}
