import { registrarIngresoPorDni } from "../services/ingresos_service.js";

export async function registrarIngreso(req, res, next) {
  try {
    const { dni } = req.body;

    if (!dni || typeof dni !== "string") {
      return res.status(400).json({
        ok: false,
        codigo: "VALIDACION",
        mensaje: "El DNI es obligatorio y debe ser texto",
      });
    }

    const r = await registrarIngresoPorDni({ dni });

    if (!r.ok) {
      if (r.codigo === "NO_EXISTE") {
        return res.status(404).json(r);
      }

      if (r.codigo === "NO_ES_ALUMNO") {
        return res.status(404).json(r);
      }

      if (
        [
          "PLAN_VENCIDO_O_INEXISTENTE",
          "SIN_INGRESOS",
        ].includes(r.codigo)
      ) {
        return res.status(409).json(r);
      }

      if (r.codigo === "VALIDACION") {
        return res.status(400).json(r);
      }

      return res.status(400).json(r);
    }

    return res.status(200).json(r);
  } catch (err) {
    next(err);
  }
}