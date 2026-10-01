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
import { responderResultado } from "../nucleo/responder.js";

const NO_ENCONTRADO = { ok: false, mensaje: "Producto no encontrado" };
const ESTADOS_MOVIMIENTO = { PRODUCTO_NO_EXISTE: 404, VALIDACION: 400, USUARIO_INVALIDO: 401, STOCK_INSUFICIENTE: 409 };

export async function listarProductosController(req, res) {
  const incluirInactivos = req.query.incluirInactivos !== "false";
  const productos = await listarProductos({ incluirInactivos });
  return res.json({ ok: true, data: productos });
}

export async function obtenerProductoController(req, res) {
  const producto = await obtenerProductoPorId(req.datos.params.id);
  if (!producto) return res.status(404).json(NO_ENCONTRADO);
  return res.json({ ok: true, data: producto });
}

export async function listarMovimientosController(req, res) {
  const movimientos = await listarMovimientosProducto(req.datos.params.id);
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
}

export async function crearProductoController(req, res) {
  // validarProductoBody responde `errores` por campo: el formulario de productos los muestra así.
  const validacion = validarProductoBody(req.body);
  if (!validacion.esValido) {
    return res.status(400).json({ ok: false, mensaje: "Datos inválidos", errores: validacion.errores });
  }

  const producto = await crearProducto(validacion.valores);
  return res.status(201).json({ ok: true, mensaje: "Producto creado correctamente", data: producto });
}

export async function actualizarProductoController(req, res) {
  const validacion = validarProductoBody(req.body);
  if (!validacion.esValido) {
    return res.status(400).json({ ok: false, mensaje: "Datos inválidos", errores: validacion.errores });
  }

  const producto = await actualizarProducto(req.datos.params.id, validacion.valores);
  if (!producto) return res.status(404).json(NO_ENCONTRADO);

  return res.json({ ok: true, mensaje: "Producto actualizado correctamente", data: producto });
}

export async function cambiarEstadoProductoController(req, res) {
  const { activo } = req.datos.body;
  const producto = await cambiarEstadoProducto(req.datos.params.id, activo);
  if (!producto) return res.status(404).json(NO_ENCONTRADO);

  return res.json({
    ok: true,
    mensaje: activo ? "Producto activado correctamente" : "Producto desactivado correctamente",
    data: producto,
  });
}

export async function registrarEntradaController(req, res) {
  const resultado = await registrarEntradaStock({
    producto_id: req.datos.params.id,
    cantidad: req.body.cantidad,
    usuario_id: req.user.usuario_id,
  });
  return responderResultado(res, resultado, ESTADOS_MOVIMIENTO, 409);
}

export async function registrarVentaController(req, res) {
  const resultado = await registrarVentaProducto({
    producto_id: req.datos.params.id,
    cantidad: req.body.cantidad,
    metodo_pago: req.body.metodo_pago,
    usuario_id: req.user.usuario_id,
  });
  return responderResultado(res, resultado, ESTADOS_MOVIMIENTO, 409);
}

export async function registrarBajaController(req, res) {
  const resultado = await registrarBajaProducto({
    producto_id: req.datos.params.id,
    cantidad: req.body.cantidad,
    motivo: req.body.motivo,
    usuario_id: req.user.usuario_id,
  });
  return responderResultado(res, resultado, ESTADOS_MOVIMIENTO, 409);
}

export async function recaudacionMensualStockController(req, res) {
  const { anio } = req.datos.query;
  const items = await recaudacionMensualStock({ anio });
  return res.json({ ok: true, anio, items });
}

export async function productosMasVendidosController(req, res) {
  const { anio } = req.datos.query;
  const items = await productosMasVendidos({ anio });
  return res.json({ ok: true, anio, items });
}

export async function mermasDeStockController(req, res) {
  const { anio } = req.datos.query;
  const items = await mermasDeStock({ anio });
  return res.json({ ok: true, anio, items });
}
