export function validarProductoBody(body) {
  const errores = [];

  const nombre = body.nombre?.toString().trim();
  const categoria = body.categoria ? body.categoria.toString().trim() : null;
  const precio_venta = Number(body.precio_venta);
  const stock_minimo = Number(body.stock_minimo);

  if (!nombre) {
    errores.push("El nombre es obligatorio");
  } else if (nombre.length < 2) {
    errores.push("El nombre debe tener al menos 2 caracteres");
  }

  if (Number.isNaN(precio_venta) || precio_venta < 0) {
    errores.push("El precio de venta debe ser un número mayor o igual a 0");
  }

  if (!Number.isInteger(stock_minimo) || stock_minimo < 0) {
    errores.push("El stock mínimo debe ser un número entero mayor o igual a 0");
  }

  return {
    esValido: errores.length === 0,
    errores,
    valores: {
      nombre,
      categoria,
      precio_venta,
      stock_minimo,
    },
  };
}
