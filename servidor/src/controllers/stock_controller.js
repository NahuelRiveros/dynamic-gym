import {
  listarProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  cambiarEstadoProducto,
  registrarEntradaStock,
  registrarVentaProducto,
  registrarBajaProducto,
  listarMovimientosProducto,
  recaudacionMensualStock,
  productosMasVendidos,
  mermasDeStock,
} from "../services/stock_service.js";
import { validarProductoBody } from "../validator/stock_validators.js";

function mapearErrorMovimiento(res, resultado) {
  if (resultado.codigo === "PRODUCTO_NO_EXISTE") return res.status(404).json(resultado);
  if (resultado.codigo === "VALIDACION") return res.status(400).json(resultado);
  if (resultado.codigo === "USUARIO_INVALIDO") return res.status(401).json(resultado);
  if (resultado.codigo === "STOCK_INSUFICIENTE") return res.status(409).json(resultado);
  return res.status(409).json(resultado);
}

export async function listarProductosController(req, res) {
  try {
    const incluirInactivos = req.query.incluirInactivos !== "false";
    const productos = await listarProductos({ incluirInactivos });
    return res.json({ ok: true, data: productos });
  } catch (error) {
    console.error("Error al listar productos:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al listar productos" });
  }
}

export async function obtenerProductoController(req, res) {
  try {
    const producto = await obtenerProductoPorId(req.params.id);
    if (!producto) return res.status(404).json({ ok: false, mensaje: "Producto no encontrado" });
    return res.json({ ok: true, data: producto });
  } catch (error) {
    console.error("Error al obtener producto:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al obtener producto" });
  }
}

export async function listarMovimientosController(req, res) {
  try {
    const movimientos = await listarMovimientosProducto(req.params.id);
    const data = movimientos.map((m) => {
      const persona = m.registrado_por?.persona;
      return {
        id: m.id,
        tipo: m.tipo,
        cantidad: m.cantidad,
        precio_unitario: m.precio_unitario,
        metodo_pago: m.metodo_pago,
        motivo: m.motivo,
        creado_en: m.creado_en,
        usuario: persona ? `${persona.nombre} ${persona.apellido}`.trim() : "—",
      };
    });
    return res.json({ ok: true, data });
  } catch (error) {
    console.error("Error al listar movimientos de stock:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al listar movimientos" });
  }
}

export async function crearProductoController(req, res) {
  try {
    const validacion = validarProductoBody(req.body);
    if (!validacion.esValido) {
      return res.status(400).json({ ok: false, mensaje: "Datos inválidos", errores: validacion.errores });
    }

    const producto = await crearProducto(validacion.valores);
    return res.status(201).json({ ok: true, mensaje: "Producto creado correctamente", data: producto });
  } catch (error) {
    console.error("Error al crear producto:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al crear producto" });
  }
}

export async function actualizarProductoController(req, res) {
  try {
    const validacion = validarProductoBody(req.body);
    if (!validacion.esValido) {
      return res.status(400).json({ ok: false, mensaje: "Datos inválidos", errores: validacion.errores });
    }

    const producto = await actualizarProducto(req.params.id, validacion.valores);
    if (!producto) return res.status(404).json({ ok: false, mensaje: "Producto no encontrado" });

    return res.json({ ok: true, mensaje: "Producto actualizado correctamente", data: producto });
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al actualizar producto" });
  }
}

export async function cambiarEstadoProductoController(req, res) {
  try {
    const { activo } = req.body;
    if (typeof activo !== "boolean") {
      return res.status(400).json({ ok: false, mensaje: "El campo activo debe ser booleano" });
    }

    const producto = await cambiarEstadoProducto(req.params.id, activo);
    if (!producto) return res.status(404).json({ ok: false, mensaje: "Producto no encontrado" });

    return res.json({
      ok: true,
      mensaje: activo ? "Producto activado correctamente" : "Producto desactivado correctamente",
      data: producto,
    });
  } catch (error) {
    console.error("Error al cambiar estado del producto:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al cambiar estado del producto" });
  }
}

export async function registrarEntradaController(req, res) {
  try {
    const resultado = await registrarEntradaStock({
      producto_id: req.params.id,
      cantidad: req.body.cantidad,
      usuario_id: req.user?.usuario_id,
    });
    if (!resultado.ok) return mapearErrorMovimiento(res, resultado);
    return res.json(resultado);
  } catch (error) {
    console.error("Error al registrar entrada de stock:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al registrar entrada de stock" });
  }
}

export async function registrarVentaController(req, res) {
  try {
    const resultado = await registrarVentaProducto({
      producto_id: req.params.id,
      cantidad: req.body.cantidad,
      metodo_pago: req.body.metodo_pago,
      usuario_id: req.user?.usuario_id,
    });
    if (!resultado.ok) return mapearErrorMovimiento(res, resultado);
    return res.json(resultado);
  } catch (error) {
    console.error("Error al registrar venta de producto:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al registrar venta de producto" });
  }
}

export async function registrarBajaController(req, res) {
  try {
    const resultado = await registrarBajaProducto({
      producto_id: req.params.id,
      cantidad: req.body.cantidad,
      motivo: req.body.motivo,
      usuario_id: req.user?.usuario_id,
    });
    if (!resultado.ok) return mapearErrorMovimiento(res, resultado);
    return res.json(resultado);
  } catch (error) {
    console.error("Error al registrar baja de stock:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al registrar baja de stock" });
  }
}

function anioDesdeQuery(req) {
  const anio = Number(req.query.anio);
  return Number.isInteger(anio) && anio > 2000 ? anio : new Date().getFullYear();
}

export async function recaudacionMensualStockController(req, res) {
  try {
    const anio = anioDesdeQuery(req);
    const items = await recaudacionMensualStock({ anio });
    return res.json({ ok: true, anio, items });
  } catch (error) {
    console.error("Error al obtener recaudación mensual de stock:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al obtener recaudación de stock" });
  }
}

export async function productosMasVendidosController(req, res) {
  try {
    const anio = anioDesdeQuery(req);
    const items = await productosMasVendidos({ anio });
    return res.json({ ok: true, anio, items });
  } catch (error) {
    console.error("Error al obtener ranking de productos vendidos:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al obtener ranking de productos" });
  }
}

export async function mermasDeStockController(req, res) {
  try {
    const anio = anioDesdeQuery(req);
    const items = await mermasDeStock({ anio });
    return res.json({ ok: true, anio, items });
  } catch (error) {
    console.error("Error al obtener mermas de stock:", error);
    return res.status(500).json({ ok: false, mensaje: "Error interno al obtener mermas de stock" });
  }
}
