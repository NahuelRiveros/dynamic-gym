import { http } from "./http";

export async function getEstadoSuscripcion() {
  const r = await http.get("/suscripcion/estado");
  return r.data;
}

export async function crearPagoSuscripcion() {
  const r = await http.post("/suscripcion/crear-pago");
  return r.data;
}

export async function getHistorialPagos() {
  const r = await http.get("/suscripcion/pagos");
  return r.data;
}
