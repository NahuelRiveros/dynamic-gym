// src/services/lista_alumnos_service.js
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
    where.push(`p.gym_persona_documento::text ILIKE :dni`);
    repl.dni = `%${dni}%`;
  }

  if (q) {
    where.push(`
      (
        p.gym_persona_documento::text ILIKE :q OR
        COALESCE(p.gym_persona_nombre,'') ILIKE :q OR
        COALESCE(p.gym_persona_apellido,'') ILIKE :q OR
        COALESCE(p.gym_persona_email,'') ILIKE :q
      )
    `);
    repl.q = `%${q}%`;
  }

  if (estado_id != null) {
    where.push(`a.gym_alumno_rela_estadoalumno = :estado_id`);
    repl.estado_id = Number(estado_id);
  }

  // plan vigente hoy (solo para filtro)
  if (plan_vigente === true) where.push(`fvig.gym_fecha_id IS NOT NULL`);
  if (plan_vigente === false) where.push(`fvig.gym_fecha_id IS NULL`);

  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // whitelist sort
  const sortMap = {
    apellido: `p.gym_persona_apellido`,
    nombre: `p.gym_persona_nombre`,
    dni: `p.gym_persona_documento`,
    estado: `a.gym_alumno_rela_estadoalumno`,
    vencimiento: `flast.pago_fin`,
  };
  const sortSQL = sortMap[sort] ?? sortMap.apellido;
  const orderSQL = String(order).toLowerCase() === "asc" ? "ASC" : "DESC";

 const sqlItems = `
  SELECT
    a.gym_alumno_id,
    a.gym_alumno_fecharegistro,

    p.gym_persona_id,
    p.gym_persona_nombre,
    p.gym_persona_apellido,
    p.gym_persona_documento,
    p.gym_persona_email,
    p.gym_persona_celular,

    a.gym_alumno_rela_estadoalumno AS estado_id,
    ea.gym_cat_estadoalumno_descripcion AS estado_desc,

    -- ✅ ÚLTIMO PAGO REAL (por id)
    flast.pago_id AS plan_id,
    flast.pago_inicio AS plan_inicio,
    flast.pago_fin AS plan_fin,
    flast.pago_ingresos_disponibles AS ingresos_disponibles,
    flast.pago_tipo_id AS plan_tipo_id,
    tp.gym_cat_tipoplan_descripcion AS plan_tipo_desc,
    flast.pago_monto AS monto_pagado,
    flast.pago_metodo AS metodo_pago,
    flast.pago_fecha AS fecha_pago,

    -- ✅ Vigente HOY (solo para badge/filtro)
    CASE WHEN fvig.gym_fecha_id IS NOT NULL THEN true ELSE false END AS tiene_plan_vigente

  FROM public.gym_alumno a
  JOIN public.gym_persona p
    ON p.gym_persona_id = a.gym_alumno_rela_persona
  LEFT JOIN public.gym_cat_estado_alumno ea
    ON ea.gym_cat_estadoalumno_id = a.gym_alumno_rela_estadoalumno

  -- vigente HOY (solo id)
  LEFT JOIN LATERAL (
    SELECT f.gym_fecha_id
    FROM public.gym_fecha_disponible f
    WHERE f.gym_fecha_rela_alumno = a.gym_alumno_id
      AND f.gym_fecha_inicio <= CURRENT_DATE
      AND f.gym_fecha_fin >= CURRENT_DATE
    ORDER BY f.gym_fecha_inicio DESC, f.gym_fecha_id DESC
    LIMIT 1
  ) fvig ON TRUE

  -- último pago REAL por id
  LEFT JOIN LATERAL (
    SELECT
      f.gym_fecha_id AS pago_id,
      f.gym_fecha_inicio AS pago_inicio,
      f.gym_fecha_fin AS pago_fin,
      f.gym_fecha_ingresosdisponibles AS pago_ingresos_disponibles,
      f.gym_fecha_rela_tipoplan AS pago_tipo_id,
      f.gym_fecha_montopagado AS pago_monto,
      f.gym_fecha_metodopago AS pago_metodo,
      f.gym_fecha_fechacambio AS pago_fecha
    FROM public.gym_fecha_disponible f
    WHERE f.gym_fecha_rela_alumno = a.gym_alumno_id
    ORDER BY f.gym_fecha_id DESC
    LIMIT 1
  ) flast ON TRUE

  LEFT JOIN public.gym_cat_tipoplan tp
    ON tp.gym_cat_tipoplan_id = flast.pago_tipo_id

  ${whereSQL}
  ORDER BY ${sortSQL} ${orderSQL}
  LIMIT :limit OFFSET :offset
`;

  const sqlCount = `
    SELECT COUNT(*)::int AS total
    FROM public.gym_alumno a
    JOIN public.gym_persona p
      ON p.gym_persona_id = a.gym_alumno_rela_persona
    LEFT JOIN LATERAL (
      SELECT f.gym_fecha_id
      FROM public.gym_fecha_disponible f
      WHERE f.gym_fecha_rela_alumno = a.gym_alumno_id
        AND f.gym_fecha_inicio <= CURRENT_DATE
        AND f.gym_fecha_fin >= CURRENT_DATE
      ORDER BY f.gym_fecha_fin DESC, f.gym_fecha_id DESC
      LIMIT 1
    ) fvig ON TRUE
    ${whereSQL}
  `;

  const items = await sequelize.query(sqlItems, { replacements: repl, type: QueryTypes.SELECT });
  const [countRow] = await sequelize.query(sqlCount, { replacements: repl, type: QueryTypes.SELECT });

  const total = countRow?.total ?? 0;
  const totalPages = Math.ceil(total / l);

  return {
    ok: true,
    items,
    pagination: { page: p, limit: l, total, totalPages },
  };
}