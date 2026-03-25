import { actualizarEstadosAlumnosAutomatico } from "../services/estado_alumno_auto_service.js";
import {
  obtenerPlanVigentePorDni,
  actualizarPlanVigentePorDni,
} from "../services/admin_planes_alumno_service.js";

export async function ActualizarEstadosAutomatico(req, res) {
  try {
    // si querés, del req.user sacás email del admin:
    const modificado_por = req.user?.email || "SYSTEM";
    console.log(modificado_por)
    const r = await actualizarEstadosAlumnosAutomatico({
      fuente: "ADMIN_PANEL",
      modificado_por,
      limit: 10000,
    });

    return res.json(r);
  } catch (e) {
    console.error("ActualizarEstadosAutomatico:", e);
    return res.status(500).json({
      ok: false,
      codigo: "ERROR_ACTUALIZAR_ESTADOS_AUTO",
      mensaje: "No se pudo actualizar estados automáticamente",
    });
  }
}

export async function buscarPlanVigenteAlumno(req, res, next) {
  try {
    const documento = String(req.query.documento ?? "").trim();

    if (!documento) {
      return res.status(400).json({
        ok: false,
        codigo: "VALIDACION",
        mensaje: "documento es obligatorio",
      });
    }

    const resultado = await obtenerPlanVigentePorDni({ documento });
    // console.log(resultado)
    if (!resultado.ok) {
      if (
        resultado.codigo === "NO_EXISTE" ||
        resultado.codigo === "NO_ES_ALUMNO"
      ) {
        return res.status(404).json(resultado);
      }

      return res.status(409).json(resultado);
    }

    return res.json(resultado);
  } catch (err) {
    next(err);
  }
}

function esNumeroValido(n) {
  const x = Number(n);
  return Number.isFinite(x) && x > 0;
}

export async function actualizarPlanVigenteAlumno(req, res, next) {
  try {
    const {
      documento,
      tipo_plan_id,
      fecha_inicio,
      fecha_fin,
      ingresos_disponibles,
    } = req.body;

    if (!documento || typeof documento !== "string") {
      return res.status(400).json({
        ok: false,
        codigo: "VALIDACION",
        mensaje: "documento es obligatorio",
      });
    }

    if (!esNumeroValido(tipo_plan_id)) {
      return res.status(400).json({
        ok: false,
        codigo: "VALIDACION",
        mensaje: "tipo_plan_id debe ser número > 0",
      });
    }

    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({
        ok: false,
        codigo: "VALIDACION",
        mensaje: "fecha_inicio y fecha_fin son obligatorias",
      });
    }

    const resultado = await actualizarPlanVigentePorDni({
      documento: documento.trim(),
      tipo_plan_id: Number(tipo_plan_id),
      fecha_inicio,
      fecha_fin,
      ingresos_disponibles:
        ingresos_disponibles == null ? null : Number(ingresos_disponibles),
      modificado_por: req.user?.email || "SYSTEM",
    });

    if (!resultado.ok) {
      if (
        resultado.codigo === "NO_EXISTE" ||
        resultado.codigo === "NO_ES_ALUMNO" ||
        resultado.codigo === "PLAN_NO_EXISTE"
      ) {
        return res.status(404).json(resultado);
      }

      if (resultado.codigo === "VALIDACION") {
        return res.status(400).json(resultado);
      }

      return res.status(409).json(resultado);
    }

    return res.json(resultado);
  } catch (err) {
    next(err);
  }
}