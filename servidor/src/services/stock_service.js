import { sequelize } from "../database/sequelize.js";
import { Producto, MovimientoStock } from "../models_v2/index.js";

export async function listarProductos({ incluirInactivos = true } = {}) {
  const where = {};
  if (!incluirInactivos) where.activo = true;

  return Producto.findAll({
    where,
    order: [["nombre", "ASC"]],
  });
}

export async function obtenerProductoPorId(id) {
  return Producto.findByPk(id);
}

export async function crearProducto(data) {
  return Producto.create({
    nombre:       data.nombre,
    categoria:    data.categoria || null,
    precio_venta: data.precio_venta,
    stock_minimo: data.stock_minimo,
    activo:       true,
  });
}

export async function actualizarProducto(id, data) {
  const producto = await Producto.findByPk(id);
  if (!producto) return null;

  await producto.update({
    nombre:       data.nombre,
    categoria:    data.categoria || null,
    precio_venta: data.precio_venta,
    stock_minimo: data.stock_minimo,
  });

  return producto;
}

export async function cambiarEstadoProducto(id, activo) {
  const producto = await Producto.findByPk(id);
  if (!producto) return null;
  await producto.update({ activo });
  return producto;
}

async function registrarMovimiento({ producto_id, tipo, cantidad, usuario_id, motivo = null, metodoPago = null }) {
  if (!Number.isFinite(Number(producto_id)) || Number(producto_id) <= 0)
    return { ok: false, codigo: "VALIDACION", mensaje: "producto_id inválido" };
  if (!Number.isInteger(Number(cantidad)) || Number(cantidad) <= 0)
    return { ok: false, codigo: "VALIDACION", mensaje: "La cantidad debe ser un entero mayor a 0" };
  if (!Number.isFinite(Number(usuario_id)) || Number(usuario_id) <= 0)
    return { ok: false, codigo: "USUARIO_INVALIDO", mensaje: "No se pudo identificar el usuario que registra el movimiento" };
  if (tipo === "baja" && !String(motivo ?? "").trim())
    return { ok: false, codigo: "VALIDACION", mensaje: "El motivo es obligatorio para dar de baja stock" };

  return sequelize.transaction(async (t) => {
    const producto = await Producto.findByPk(Number(producto_id), {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!producto)
      return { ok: false, codigo: "PRODUCTO_NO_EXISTE", mensaje: "No existe el producto indicado" };

    const cant = Number(cantidad);

    if (tipo === "entrada") {
      await producto.update({ stock_actual: producto.stock_actual + cant }, { transaction: t });
    } else {
      if (producto.stock_actual < cant)
        return {
          ok: false,
          codigo: "STOCK_INSUFICIENTE",
          mensaje: `Stock insuficiente: quedan ${producto.stock_actual} unidad(es)`,
        };
      await producto.update({ stock_actual: producto.stock_actual - cant }, { transaction: t });
    }

    const movimiento = await MovimientoStock.create({
      producto_id: producto.id,
      tipo,
      motivo: tipo === "baja" ? String(motivo).trim() : null,
      cantidad: cant,
      precio_unitario: tipo === "venta" ? producto.precio_venta : null,
      metodo_pago: tipo === "venta" ? metodoPago : null,
      registrado_por_id: Number(usuario_id),
    }, { transaction: t });

    return {
      ok: true,
      mensaje: "Movimiento registrado correctamente",
      data: {
        producto_id: producto.id,
        stock_actual: producto.stock_actual,
        movimiento_id: movimiento.id,
      },
    };
  });
}

export async function registrarEntradaStock({ producto_id, cantidad, usuario_id }) {
  return registrarMovimiento({ producto_id, tipo: "entrada", cantidad, usuario_id });
}

export async function registrarVentaProducto({ producto_id, cantidad, metodo_pago, usuario_id }) {
  if (!String(metodo_pago ?? "").trim())
    return { ok: false, codigo: "VALIDACION", mensaje: "metodo_pago es obligatorio" };
  return registrarMovimiento({ producto_id, tipo: "venta", cantidad, usuario_id, metodoPago: String(metodo_pago).trim() });
}

export async function registrarBajaProducto({ producto_id, cantidad, motivo, usuario_id }) {
  return registrarMovimiento({ producto_id, tipo: "baja", cantidad, usuario_id, motivo });
}

export async function recaudacionMensualStock({ anio }) {
  return sequelize.query(
    `
    SELECT
      EXTRACT(MONTH FROM creado_en)::int AS mes,
      SUM(cantidad * precio_unitario)::numeric AS total_recaudado,
      SUM(cantidad)::int AS total_unidades
    FROM gym_v3.movimiento_stock
    WHERE tipo = 'venta' AND EXTRACT(YEAR FROM creado_en) = :anio
    GROUP BY mes
    ORDER BY mes
    `,
    { replacements: { anio }, type: sequelize.QueryTypes.SELECT }
  );
}

export async function productosMasVendidos({ anio }) {
  return sequelize.query(
    `
    SELECT
      p.id,
      p.nombre AS producto,
      SUM(m.cantidad)::int AS total_ventas,
      SUM(m.cantidad * m.precio_unitario)::numeric AS total_recaudado
    FROM gym_v3.movimiento_stock m
    JOIN gym_v3.producto p ON p.id = m.producto_id
    WHERE m.tipo = 'venta' AND EXTRACT(YEAR FROM m.creado_en) = :anio
    GROUP BY p.id, p.nombre
    ORDER BY total_recaudado DESC
    `,
    { replacements: { anio }, type: sequelize.QueryTypes.SELECT }
  );
}

export async function mermasDeStock({ anio }) {
  return sequelize.query(
    `
    SELECT
      COALESCE(motivo, 'Sin motivo') AS motivo,
      SUM(cantidad)::int AS total_unidades
    FROM gym_v3.movimiento_stock
    WHERE tipo = 'baja' AND EXTRACT(YEAR FROM creado_en) = :anio
    GROUP BY motivo
    ORDER BY total_unidades DESC
    `,
    { replacements: { anio }, type: sequelize.QueryTypes.SELECT }
  );
}
