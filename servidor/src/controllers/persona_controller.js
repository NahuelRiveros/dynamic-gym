import { registrarPersonaConAlumno } from "../services/persona_service.js";

export async function registrar(req, res, next) {
  try {
    const data = req.body;
    
    // validación mínima “clásica”
    if (!data.nombre || !data.apellido || !data.documento) {
      return res.status(400).json({
        ok: false,
        codigo: "VALIDACION",
        mensaje: "nombre, apellido y documento son obligatorios"
      });
    }

    const r = await registrarPersonaConAlumno(data);
    //console.log("test",r);
    if (!r.ok && (r.codigo === "DOCUMENTO_DUPLICADO" || r.codigo === "EMAIL_DUPLICADO")) {
      return res.status(409).json(r);
    }

    return res.json(r);
  } catch (err) {
    next(err);
  }
}
