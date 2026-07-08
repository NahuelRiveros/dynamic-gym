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

// Catálogo: solo admin
stockRouter.post("/",            requireRole("admin"), crearProductoController);
stockRouter.put("/:id",          requireRole("admin"), actualizarProductoController);
stockRouter.patch("/:id/estado", requireRole("admin"), cambiarEstadoProductoController);

// Movimientos del día a día: admin y staff
stockRouter.post("/:id/entrada", requireRole("admin", "staff"), registrarEntradaController);
stockRouter.post("/:id/venta",   requireRole("admin", "staff"), registrarVentaController);
stockRouter.post("/:id/baja",    requireRole("admin", "staff"), registrarBajaController);
