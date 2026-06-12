import { sequelize } from "../database/sequelize.js";
import { QueryTypes } from "sequelize";

export async function listarAlumnos({
  q,
  dni,
  estado_id,
  plan_vigente,
  page = 1,
  limit = 20,
  sort = "apellido",
  order = "asc",
}) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (p - 1) * l;

  const where = [];
  const repl = { limit: l, offset };

  if (dni) {
    where.push(`p.documento::text ILIKE :dni`);
    repl.dni = `%${dni}%`;
  }

  if (q) {
    where.push(`
      (
        p.documento::text ILIKE :q OR
        COALESCE(p.nombre,'') ILIKE :q OR
        COALESCE(p.apellido,'') ILIKE :q OR
        COALESCE(p.email,'') ILIKE :q
      )
    `);
    repl.q = `%${q}%`;
  }

  if (estado_id != null) {
    where.push(`a.estado_id = :estado_id`);
    repl.estado_id = Number(estado_id);
  }

  if (plan_vigente === true)  where.push(`fvig.id IS NOT NULL`);
  if (plan_vigente === false) where.push(`fvig.id IS NULL`);

  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const sortMap = {
    apellido:    `p.apellido`,
    nombre:      `p.nombre`,
    dni:         `p.documento`,
    estado:      `a.estado_id`,
    vencimiento: `flast.pago_fin`,
  };
  const sortSQL  = sortMap[sort] ?? sortMap.apellido;
  const orderSQL = String(order).toLowerCase() === "asc" ? "ASC" : "DESC";

  const sqlItems = `
    SELECT
      a.id AS gym_alumno_id,
      a.fecha_registro AS gym_alumno_fecharegistro,

      p.id AS gym_persona_id,
      p.nombre AS gym_persona_nombre,
      p.apellido AS gym_persona_apellido,
      p.documento AS gym_persona_documento,
      p.email AS gym_persona_email,
      p.celular AS gym_persona_celular,

      a.estado_id,
      ea.descripcion AS estado_desc,

      flast.pago_id AS plan_id,
      flast.pago_inicio AS plan_inicio,
      flast.pago_fin AS plan_fin,
      flast.pago_ingresos_disponibles AS ingresos_disponibles,
      flast.pago_tipo_id AS plan_tipo_id,
      tp.descripcion AS plan_tipo_desc,
      flast.pago_monto AS monto_pagado,
      flast.pago_metodo AS metodo_pago,
      flast.pago_fecha AS fecha_pago,

      CASE WHEN fvig.id IS NOT NULL THEN true ELSE false END AS tiene_plan_vigente

    FROM alumno a
    JOIN persona p ON p.id = a.persona_id
    LEFT JOIN alumno_estado ea ON ea.id = a.estado_id

    LEFT JOIN LATERAL (
      SELECT f.id
      FROM membresia f
      WHERE f.alumno_id = a.id
        AND f.fecha_inicio <= CURRENT_DATE
        AND f.fecha_fin >= CURRENT_DATE
      ORDER BY f.fecha_inicio DESC, f.id DESC
      LIMIT 1
    ) fvig ON TRUE

    LEFT JOIN LATERAL (
      SELECT
        f.id          AS pago_id,
        f.fecha_inicio AS pago_inicio,
        f.fecha_fin    AS pago_fin,
        f.ingresos_disponibles AS pago_ingresos_disponibles,
        f.plan_tipo_id AS pago_tipo_id,
        f.monto_pagado AS pago_monto,
        f.metodo_pago  AS pago_metodo,
        f.actualizado_en AS pago_fecha
      FROM membresia f
      WHERE f.alumno_id = a.id
      ORDER BY f.id DESC
      LIMIT 1
    ) flast ON TRUE

    LEFT JOIN plan_tipo tp ON tp.id = flast.pago_tipo_id

    ${whereSQL}
    ORDER BY ${sortSQL} ${orderSQL}
    LIMIT :limit OFFSET :offset
  `;

  const sqlCount = `
    SELECT COUNT(*)::int AS total
    FROM alumno a
    JOIN persona p ON p.id = a.persona_id
    LEFT JOIN LATERAL (
      SELECT f.id
      FROM membresia f
      WHERE f.alumno_id = a.id
        AND f.fecha_inicio <= CURRENT_DATE
        AND f.fecha_fin >= CURRENT_DATE
      ORDER BY f.fecha_fin DESC, f.id DESC
      LIMIT 1
    ) fvig ON TRUE
    ${whereSQL}
  `;

  const items    = await sequelize.query(sqlItems, { replacements: repl, type: QueryTypes.SELECT });
  const [countRow] = await sequelize.query(sqlCount, { replacements: repl, type: QueryTypes.SELECT });

  const total      = countRow?.total ?? 0;
  const totalPages = Math.ceil(total / l);

  return {
    ok: true,
    items,
    pagination: { page: p, limit: l, total, totalPages },
  };
}
