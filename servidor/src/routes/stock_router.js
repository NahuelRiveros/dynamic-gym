import { Router } from "express";
import {
  listarProductosController,
  obtenerProductoController,
  crearProductoController,
  actualizarProductoController,
  cambiarEstadoProductoController,
  registrarEntradaController,
  registrarVentaController,
  registrarBajaController,
  listarMovimientosController,
  recaudacionMensualStockController,
  productosMasVendidosController,
  mermasDeStockController,
} from "../controllers/stock_controller.js";
import { requireAuth, requireRole } from "../middleware/auth_middleware.js";
import { validar } from "../nucleo/validar.js";
import { idPositivo, z } from "../nucleo/zod.js";

export const stockRouter = Router();

const conId = validar({ params: z.object({ id: idPositivo("id inválido") }) });
const estadoValido = validar({
  params: z.object({ id: idPositivo("id inválido") }),
  body: z.object({ activo: z.boolean({ error: "El campo activo debe ser booleano" }) }),
});
// Año de las estadísticas: si no viene o no es válido, el actual (como antes).
const conAnio = validar({
  query: z.object({
    anio: z.unknown().optional().transform((v) => {
      const anio = Number(v);
      return Number.isInteger(anio) && anio > 2000 ? anio : new Date().getFullYear();
    }),
  }),
});
// La cantidad, el método de pago y el motivo los valida el servicio (mismos códigos de siempre).

stockRouter.use(requireAuth);

// Estadísticas: solo admin (igual que /recaudacion)
stockRouter.get("/estadisticas/mensual",                requireRole("admin"), conAnio, recaudacionMensualStockController);
stockRouter.get("/estadisticas/productos-mas-vendidos",  requireRole("admin"), conAnio, productosMasVendidosController);
stockRouter.get("/estadisticas/mermas",                  requireRole("admin"), conAnio, mermasDeStockController);

// Lectura: admin y staff
stockRouter.get("/",    requireRole("admin", "staff"), listarProductosController);
stockRouter.get("/:id", requireRole("admin", "staff"), conId, obtenerProductoController);

// Historial de movimientos (auditoría: fecha/hora y usuario): solo admin
stockRouter.get("/:id/movimientos", requireRole("admin"), conId, listarMovimientosController);

// Catálogo: solo admin
stockRouter.post("/",            requireRole("admin"), crearProductoController);
stockRouter.put("/:id",          requireRole("admin"), conId, actualizarProductoController);
stockRouter.patch("/:id/estado", requireRole("admin"), estadoValido, cambiarEstadoProductoController);

// Reponer y vender: admin y staff. Dar de baja: solo admin.
stockRouter.post("/:id/entrada", requireRole("admin", "staff"), conId, registrarEntradaController);
stockRouter.post("/:id/venta",   requireRole("admin", "staff"), conId, registrarVentaController);
stockRouter.post("/:id/baja",    requireRole("admin"), conId, registrarBajaController);
