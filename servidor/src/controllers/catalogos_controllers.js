import { obtenerCatalogos } from "../services/catalogos_service.js";

export async function catalogosController(req, res) {
  try {
    const data = await obtenerCatalogos();
    return res.json({ ok: true, ...data });
  } catch (e) {
    console.error("Catalogos:", e);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al obtener catálogos",
    });
  }
}