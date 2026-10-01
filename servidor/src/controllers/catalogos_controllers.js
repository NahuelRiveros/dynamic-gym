import { obtenerCatalogos } from "../services/catalogos_service.js";

export async function catalogosController(_req, res) {
  const data = await obtenerCatalogos();
  return res.json({ ok: true, ...data });
}
