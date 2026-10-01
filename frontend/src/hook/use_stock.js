import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  actualizarProducto,
  cambiarEstadoProducto,
  crearProducto,
  getMermasDeStock,
  getProductosMasVendidos,
  getRecaudacionMensualStock,
  listarProductos,
  registrarBaja,
  registrarEntrada,
  registrarVenta,
} from "../api/stock_api.js";
import { exigirOk } from "./consultas_utils.js";

// Todo lo de stock cuelga de "stock": una venta cambia productos, historial y estadísticas a la vez.
export const stockKeys = {
  todo: ["stock"],
  productos: () => ["stock", "productos"],
  estadisticas: (anio) => ["stock", "estadisticas", anio],
};

export function useProductos() {
  return useQuery({
    queryKey: stockKeys.productos(),
    queryFn: async () => exigirOk(await listarProductos(), "No se pudieron cargar los productos").data ?? [],
  });
}

/** Recaudación por mes, ranking de productos y mermas del año: las tres consultas juntas. */
export function useEstadisticasStock(anio) {
  return useQuery({
    queryKey: stockKeys.estadisticas(anio),
    queryFn: async () => {
      const [mensual, ranking, mermas] = await Promise.all([
        getRecaudacionMensualStock({ anio }),
        getProductosMasVendidos({ anio }),
        getMermasDeStock({ anio }),
      ]);
      return { mensual: mensual.items ?? [], ranking: ranking.items ?? [], mermas: mermas.items ?? [] };
    },
  });
}

function useMutacionStock(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: stockKeys.todo }),
  });
}

/** Crea (sin id) o actualiza (con id) un producto del catálogo. */
export const useGuardarProducto = () =>
  useMutacionStock(({ id, datos }) => (id ? actualizarProducto(id, datos) : crearProducto(datos)));

export const useCambiarEstadoProducto = () =>
  useMutacionStock(({ id, activo }) => cambiarEstadoProducto(id, activo));

const REGISTRAR = {
  entrada: (id, { cantidad }) => registrarEntrada(id, { cantidad }),
  venta: (id, { cantidad, metodo_pago }) => registrarVenta(id, { cantidad, metodo_pago }),
  baja: (id, { cantidad, motivo }) => registrarBaja(id, { cantidad, motivo }),
};

/** Reponer, vender o dar de baja: { tipo: "entrada" | "venta" | "baja", id, cantidad, metodo_pago, motivo }. */
export const useMovimientoStock = () =>
  useMutacionStock(({ tipo, id, ...datos }) => REGISTRAR[tipo](id, datos));
