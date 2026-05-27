/**
 * consulta_publica_service.js
 *
 * Consulta de plan por DNI — ruta pública, sin auth.
 * Solo devuelve datos no sensibles: nombre/apellido, estado, plan vigente.
 * No expone montos, métodos de pago, email ni teléfono.
 */

import { sequelize } from "../database/sequelize.js";
import { QueryTypes } from "sequelize";

const normalizarDni = (doc) =>
  String(doc ?? "").replace(/[.\s]/g, "").trim();

export async function consultarPlanPorDni(dni) {
  const dniNorm = normalizarDni(dni);
  const dniNum  = Number(dniNorm);

  if (!Number.isFinite(dniNum) || dniNum <= 0) {
    return { ok: false, codigo: "VALIDACION", mensaje: "DNI inválido" };
  }

  // ── Alumno + persona + estado ──────────────────────────────────────────────
  const sqlAlumno = `
    SELECT
      a.gym_alumno_id,
      a.gym_alumno_rela_estadoalumno AS estado_id,
      ea.gym_cat_estadoalumno_descripcion AS estado_desc,
      p.gym_persona_nombre,
      p.gym_persona_apellido,
      p.gym_persona_documento
    FROM gym_alumno a
    JOIN gym_persona p
      ON p.gym_persona_id = a.gym_alumno_rela_persona
    LEFT JOIN gym_cat_estado_alumno ea
      ON ea.gym_cat_estadoalumno_id = a.gym_alumno_rela_estadoalumno
    WHERE p.gym_persona_documento = :dni
    LIMIT 1;
  `;

  const rows = await sequelize.query(sqlAlumno, {
    replacements: { dni: dniNum },
    type: QueryTypes.SELECT,
  });

  if (!rows.length) {
    return {
      ok:      false,
      codigo:  "NO_EXISTE",
      mensaje: "No se encontró ningún alumno con ese DNI",
    };
  }

  const alumno     = rows[0];
  const alumno_id  = alumno.gym_alumno_id;

  // ── Plan actual ───────────────────────────────────────────────────────────
  // Regla: primero vigente hoy, si no el más reciente por fecha_fin.
  const sqlPlan = `
    WITH fvig AS (
      SELECT f.gym_fecha_id
      FROM   gym_fecha_disponible f
      WHERE  f.gym_fecha_rela_alumno = :alumno_id
        AND  f.gym_fecha_inicio <= CURRENT_DATE
        AND  f.gym_fecha_fin    >= CURRENT_DATE
      ORDER BY f.gym_fecha_fin DESC, f.gym_fecha_id DESC
      LIMIT 1
    ),
    fult AS (
      SELECT f.gym_fecha_id
      FROM   gym_fecha_disponible f
      WHERE  f.gym_fecha_rela_alumno = :alumno_id
        AND  f.gym_fecha_fin IS NOT NULL
      ORDER BY f.gym_fecha_fin DESC, f.gym_fecha_id DESC
      LIMIT 1
    )
    SELECT
      f.gym_fecha_inicio              AS inicio,
      f.gym_fecha_fin                 AS fin,
      f.gym_fecha_ingresosdisponibles AS ingresos_disponibles,
      tp.gym_cat_tipoplan_descripcion AS tipoplan_desc,
      CASE
        WHEN (SELECT gym_fecha_id FROM fvig) IS NOT NULL THEN true
        ELSE false
      END AS vigente_hoy,
      -- días que quedan (negativo = ya venció)
      (f.gym_fecha_fin::date - CURRENT_DATE)::int AS dias_restantes
    FROM   gym_fecha_disponible f
    LEFT JOIN gym_cat_tipoplan tp
      ON tp.gym_cat_tipoplan_id = f.gym_fecha_rela_tipoplan
    WHERE  f.gym_fecha_id = COALESCE(
             (SELECT gym_fecha_id FROM fvig),
             (SELECT gym_fecha_id FROM fult)
           )
    LIMIT 1;
  `;

  const planRows = await sequelize.query(sqlPlan, {
    replacements: { alumno_id },
    type: QueryTypes.SELECT,
  });

  const plan = planRows[0] ?? null;

  return {
    ok: true,
    alumno: {
      nombre:    alumno.gym_persona_nombre,
      apellido:  alumno.gym_persona_apellido,
      documento: alumno.gym_persona_documento,
      estado_id: alumno.estado_id,
      estado_desc: alumno.estado_desc,
    },
    plan_actual: plan
      ? {
          tipoplan_desc:       plan.tipoplan_desc,
          inicio:              plan.inicio   ? String(plan.inicio).slice(0, 10)  : null,
          fin:                 plan.fin      ? String(plan.fin).slice(0, 10)     : null,
          ingresos_disponibles: plan.ingresos_disponibles,
          vigente_hoy:         plan.vigente_hoy,
          dias_restantes:      plan.dias_restantes,
        }
      : null,
  };
}
