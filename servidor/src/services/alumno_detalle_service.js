import { sequelize } from "../database/sequelize.js";
import { QueryTypes } from "sequelize";

export async function obtenerDetalleAlumno({ alumno_id }) {
  const sqlAlumno = `
    SELECT
      a.id AS gym_alumno_id,
      a.fecha_registro AS gym_alumno_fecharegistro,
      a.estado_id,
      ea.descripcion AS estado_desc,

      p.id AS gym_persona_id,
      p.nombre AS gym_persona_nombre,
      p.apellido AS gym_persona_apellido,
      p.documento AS gym_persona_documento,
      p.email AS gym_persona_email,
      p.celular AS gym_persona_celular,
      p.fecha_nacimiento AS gym_persona_fechanacimiento
    FROM alumno a
    JOIN persona p ON p.id = a.persona_id
    LEFT JOIN alumno_estado ea ON ea.id = a.estado_id
    WHERE a.id = :alumno_id
    LIMIT 1;
  `;

  const alumno = await sequelize.query(sqlAlumno, {
    replacements: { alumno_id },
    type: QueryTypes.SELECT,
  });

  if (!alumno?.length)
    return { ok: false, codigo: "NO_EXISTE", mensaje: "No existe el alumno" };

  const sqlPlanActual = `
    WITH fvig AS (
      SELECT f.id
      FROM membresia f
      WHERE f.alumno_id = :alumno_id
        AND f.fecha_inicio <= CURRENT_DATE
        AND f.fecha_fin >= CURRENT_DATE
      ORDER BY f.fecha_fin DESC, f.id DESC
      LIMIT 1
    ),
    fult AS (
      SELECT f.id
      FROM membresia f
      WHERE f.alumno_id = :alumno_id
        AND f.fecha_fin IS NOT NULL
      ORDER BY f.fecha_fin DESC, f.id DESC
      LIMIT 1
    )
    SELECT
      f.id AS plan_id,
      f.fecha_inicio AS inicio,
      f.fecha_fin AS fin,
      f.monto_pagado,
      f.metodo_pago,
      f.ingresos_disponibles,
      f.plan_tipo_id AS tipoplan_id,
      tp.descripcion AS tipoplan_desc,
      CASE WHEN (SELECT id FROM fvig) IS NOT NULL THEN true ELSE false END AS vigente_hoy
    FROM membresia f
    LEFT JOIN plan_tipo tp ON tp.id = f.plan_tipo_id
    WHERE f.id = COALESCE((SELECT id FROM fvig),(SELECT id FROM fult))
    LIMIT 1;
  `;

  const plan_actual = await sequelize.query(sqlPlanActual, {
    replacements: { alumno_id },
    type: QueryTypes.SELECT,
  });

  const sqlPlanes = `
    SELECT
      f.id AS plan_id,
      f.fecha_inicio AS inicio,
      f.fecha_fin AS fin,
      f.monto_pagado,
      f.metodo_pago,
      f.dias_totales AS dias_ingreso,
      f.ingresos_disponibles,
      f.plan_tipo_id AS tipoplan_id,
      tp.descripcion AS tipoplan_desc
    FROM membresia f
    LEFT JOIN plan_tipo tp ON tp.id = f.plan_tipo_id
    WHERE f.alumno_id = :alumno_id
    ORDER BY f.fecha_fin DESC NULLS LAST, f.id DESC;
  `;

  const planes = await sequelize.query(sqlPlanes, {
    replacements: { alumno_id },
    type: QueryTypes.SELECT,
  });

  const total_pagos      = planes.length;
  const total_recaudado  = planes.reduce((acc, it) => acc + Number(it.monto_pagado || 0), 0);
  const ultimo_pago_fecha = planes?.[0]?.inicio ? String(planes[0].inicio).slice(0, 10) : null;

  return {
    ok: true,
    alumno: alumno[0],
    plan_actual: plan_actual?.[0] ?? null,
    planes,
    resumen: { total_pagos, total_recaudado, ultimo_pago_fecha },
  };
}
