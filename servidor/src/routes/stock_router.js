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

export const stockRouter = Router();

stockRouter.use(requireAuth);

// Estadísticas: solo admin (igual que /recaudacion)
stockRouter.get("/estadisticas/mensual",                requireRole("admin"), recaudacionMensualStockController);
stockRouter.get("/estadisticas/productos-mas-vendidos",  requireRole("admin"), productosMasVendidosController);
stockRouter.get("/estadisticas/mermas",                  requireRole("admin"), mermasDeStockController);

// Lectura: admin y staff
stockRouter.get("/",    requireRole("admin", "staff"), listarProductosController);
stockRouter.get("/:id", requireRole("admin", "staff"), obtenerProductoController);

// Historial de movimientos (auditoría: fecha/hora y usuario): solo admin
stockRouter.get("/:id/movimientos", requireRole("admin"), listarMovimientosController);

// Catálogo: solo admin
stockRouter.post("/",            requireRole("admin"), crearProductoController);
stockRouter.put("/:id",          requireRole("admin"), actualizarProductoController);
stockRouter.patch("/:id/estado", requireRole("admin"), cambiarEstadoProductoController);

// Reponer y vender: admin y staff. Dar de baja: solo admin.
stockRouter.post("/:id/entrada", requireRole("admin", "staff"), registrarEntradaController);
stockRouter.post("/:id/venta",   requireRole("admin", "staff"), registrarVentaController);
stockRouter.post("/:id/baja",    requireRole("admin"), registrarBajaController);
