import { http } from "./http";

// LISTAR
export async function listarProductos(params = {}) {
  const r = await http.get("/stock", { params });
  return r.data;
}

// OBTENER POR ID
export async function obtenerProducto(id) {
  const r = await http.get(`/stock/${id}`);
  return r.data;
}

// CREAR (solo admin)
export async function crearProducto(payload) {
  const r = await http.post("/stock", payload);
  return r.data;
}

// ACTUALIZAR (solo admin)
export async function actualizarProducto(id, payload) {
  const r = await http.put(`/stock/${id}`, payload);
  return r.data;
}

// ACTIVAR/DESACTIVAR (solo admin)
export async function cambiarEstadoProducto(id, activo) {
  const r = await http.patch(`/stock/${id}/estado`, { activo });
  return r.data;
}

// REPONER STOCK
export async function registrarEntrada(id, { cantidad }) {
  const r = await http.post(`/stock/${id}/entrada`, { cantidad });
  return r.data;
}

// VENDER
export async function registrarVenta(id, { cantidad, metodo_pago }) {
  const r = await http.post(`/stock/${id}/venta`, { cantidad, metodo_pago });
  return r.data;
}

// DAR DE BAJA
export async function registrarBaja(id, { cantidad, motivo }) {
  const r = await http.post(`/stock/${id}/baja`, { cantidad, motivo });
  return r.data;
}

// HISTORIAL DE MOVIMIENTOS (solo admin)
export async function obtenerMovimientos(id) {
  const r = await http.get(`/stock/${id}/movimientos`);
  return r.data;
}

// ESTADÍSTICAS (solo admin)
export async function getRecaudacionMensualStock(params = {}) {
  const r = await http.get("/stock/estadisticas/mensual", { params });
  return r.data;
}

export async function getProductosMasVendidos(params = {}) {
  const r = await http.get("/stock/estadisticas/productos-mas-vendidos", { params });
  return r.data;
}

export async function getMermasDeStock(params = {}) {
  const r = await http.get("/stock/estadisticas/mermas", { params });
  return r.data;
}
