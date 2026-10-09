import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getEstadoSuscripcion,
  getSuperEstadoSuscripcion,
  superExtenderSuscripcion,
  superFijarFechaSuscripcion,
  superFijarPrecioSuscripcion,
} from "../api/suscripcion_api.js";
import { exigirOk } from "./consultas_utils.js";

export const suscripcionKeys = {
  todo: ["suscripcion"],
  estado: () => ["suscripcion", "estado"],
  superEstado: () => ["suscripcion", "super-estado"],
};

// El estado cambia como mucho una vez por día: una hora en caché. Antes el banner lo pedía cada
// 15 minutos y eso despertaba a Neon todo el día mientras el panel quedaba abierto.
const UNA_HORA = 60 * 60 * 1000;

/** Estado de la suscripción para el admin (banner y página "Suscripción" comparten la caché). */
export function useEstadoSuscripcion({ enabled = true } = {}) {
  return useQuery({
    queryKey: suscripcionKeys.estado(),
    queryFn: getEstadoSuscripcion,
    staleTime: UNA_HORA,
    enabled,
  });
}

export function useSuperEstadoSuscripcion() {
  return useQuery({
    queryKey: suscripcionKeys.superEstado(),
    queryFn: async () => exigirOk(await getSuperEstadoSuscripcion(), "No se pudo obtener el estado de suscripción"),
  });
}

// Extender o fijar cambia el estado que ven el super admin, el admin y el banner.
function useMutacionSuscripcion(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: suscripcionKeys.todo }),
  });
}

export const useExtenderSuscripcion = () => useMutacionSuscripcion((dias) => superExtenderSuscripcion(dias));
export const useFijarFechaSuscripcion = () => useMutacionSuscripcion((fecha) => superFijarFechaSuscripcion(fecha));
export const useFijarPrecioSuscripcion = () =>
  useMutacionSuscripcion(async (precio) => exigirOk(await superFijarPrecioSuscripcion(precio), "No se pudo cambiar el precio"));
