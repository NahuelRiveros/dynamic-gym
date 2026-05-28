import { http } from "./http";

export async function getPreviewDestinatarios(filtro = "todos") {
  const r = await http.get(`/promociones/preview?filtro=${filtro}`);
  return r.data;
}

export async function getNumerosWhatsApp(filtro = "todos") {
  const r = await http.get(`/promociones/numeros?filtro=${filtro}`);
  return r.data;
}

export async function enviarPromocion({ filtro, subject, html }) {
  const r = await http.post("/promociones/enviar", { filtro, subject, html });
  return r.data;
}
