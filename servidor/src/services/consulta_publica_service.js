import { sequelize } from "../database/sequelize.js";
import { QueryTypes } from "sequelize";

const normalizarDni = (doc) => String(doc ?? "").replace(/[.\s]/g, "").trim();

export async function consultarPlanPorDni(dni) {
  const dniNorm = normalizarDni(dni);

  if (!dniNorm || !/^\d+$/.test(dniNorm))
    return { ok: false, codigo: "VALIDACION", mensaje: "DNI inválido" };

  const sqlAlumno = `
    SELECT
      a.id AS gym_alumno_id,
      a.estado_id,
      ea.descripcion AS estado_desc,
      p.nombre AS gym_persona_nombre,
      p.apellido AS gym_persona_apellido,
      p.documento AS gym_persona_documento
    FROM alumno a
    JOIN persona p ON p.id = a.persona_id
    LEFT JOIN alumno_estado ea ON ea.id = a.estado_id
    WHERE p.documento = :dni
    LIMIT 1;
  `;

  const rows = await sequelize.query(sqlAlumno, {
    replacements: { dni: dniNorm },
    type: QueryTypes.SELECT,
  });

  if (!rows.length)
    return { ok: false, codigo: "NO_EXISTE", mensaje: "No se encontró ningún alumno con ese DNI" };

  const alumno    = rows[0];
  const alumno_id = alumno.gym_alumno_id;

  const sqlPlan = `
    WITH fvig AS (
      SELECT f.id
      FROM   membresia f
      WHERE  f.alumno_id = :alumno_id
        AND  f.fecha_inicio <= CURRENT_DATE
        AND  f.fecha_fin    >= CURRENT_DATE
      ORDER BY f.fecha_fin DESC, f.id DESC
      LIMIT 1
    ),
    fult AS (
      SELECT f.id
      FROM   membresia f
      WHERE  f.alumno_id = :alumno_id
        AND  f.fecha_fin IS NOT NULL
      ORDER BY f.fecha_fin DESC, f.id DESC
      LIMIT 1
    )
    SELECT
      f.fecha_inicio AS inicio,
      f.fecha_fin AS fin,
      f.ingresos_disponibles,
      tp.descripcion AS tipoplan_desc,
      CASE
        WHEN (SELECT id FROM fvig) IS NOT NULL THEN true
        ELSE false
      END AS vigente_hoy,
      (f.fecha_fin::date - CURRENT_DATE)::int AS dias_restantes
    FROM   membresia f
    LEFT JOIN plan_tipo tp ON tp.id = f.plan_tipo_id
    WHERE  f.id = COALESCE((SELECT id FROM fvig),(SELECT id FROM fult))
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
          tipoplan_desc:        plan.tipoplan_desc,
          inicio:               plan.inicio ? String(plan.inicio).slice(0, 10) : null,
          fin:                  plan.fin    ? String(plan.fin).slice(0, 10)    : null,
          ingresos_disponibles: plan.ingresos_disponibles,
          vigente_hoy:          plan.vigente_hoy,
          dias_restantes:       plan.dias_restantes,
        }
      : null,
  };
}
