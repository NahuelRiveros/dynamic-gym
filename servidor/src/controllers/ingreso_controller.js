import { registrarIngresoPorDni } from "../services/ingresos_service.js";

export async function registrarIngreso(req, res, next) {
  try {
    const { dni } = req.body;
    console.log(req.body)
    if (!dni || typeof dni !== "string") {
      return res.status(400).json({
        ok: false,
        codigo: "VALIDACION",
        mensaje: "documento es obligatorio y debe ser string",
      });
    }

    const r = await registrarIngresoPorDni({ dni });

    if (!r.ok) {
      if (r.codigo === "NO_EXISTE") return res.status(404).json(r);
      // conflictos de negocio
      if (["RESTRINGIDO", "VENCIDO", "SIN_INGRESOS"].includes(r.codigo)) {
        return res.status(409).json(r);
      }
      return res.status(400).json(r);
    }

    return res.json(r);
  } catch (err) {
    next(err);
  }
}
