import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { actualizarStaff, cambiarEstadoStaff, cambiarPasswordStaff, crearStaff, obtenerStaff } from "../api/staff_api.js";
import { exigirOk } from "./consultas_utils.js";

export const staffKeys = {
  todo: ["staff"],
  lista: () => ["staff", "lista"],
};

export function useStaff() {
  return useQuery({
    queryKey: staffKeys.lista(),
    queryFn: async () => exigirOk(await obtenerStaff(), "No se pudo cargar el staff").data ?? [],
  });
}

// Las tres modificaciones vuelven a pedir la lista al terminar bien.
function useMutacionStaff(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: staffKeys.todo }),
  });
}

/** Crea (sin usuarioId) o actualiza (con usuarioId) un staff. */
export const useGuardarStaff = () =>
  useMutacionStaff(({ usuarioId, datos }) => (usuarioId ? actualizarStaff(usuarioId, datos) : crearStaff(datos)));

export const useCambiarPasswordStaff = () =>
  useMutacionStaff(({ usuarioId, password }) => cambiarPasswordStaff(usuarioId, password));

export const useCambiarEstadoStaff = () =>
  useMutacionStaff(({ usuarioId, activo }) => cambiarEstadoStaff(usuarioId, activo));
