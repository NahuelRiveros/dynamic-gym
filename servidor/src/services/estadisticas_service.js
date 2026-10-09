import { sequelize } from "../database/sequelize.js";
import { QueryTypes } from "sequelize";

export async function obtenerAlumnosNuevos({ desde, hasta } = {}) {
  const hoy = new Date();
  const fechaDesde = desde ? new Date(desde) : new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const fechaHasta = hasta ? new Date(hasta) : new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);

  const sql = `
    SELECT
      a.id AS gym_alumno_id,
      a.fecha_registro AS gym_alumno_fecharegistro,
      p.nombre AS gym_persona_nombre,
      p.apellido AS gym_persona_apellido,
      p.documento AS gym_persona_documento,
      p.email AS gym_persona_email
    FROM gym_v3.alumno a
    INNER JOIN gym_v3.persona p ON p.id = a.persona_id
    WHERE a.fecha_registro >= :desde
      AND a.fecha_registro < :hasta
    ORDER BY a.fecha_registro DESC;
  `;

  const items = await sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: { desde: fechaDesde, hasta: fechaHasta },
  });

  return { items };
}

export async function obtenerVencimientos({ dias = 7 } = {}) {
  const sql = `
    SELECT
      a.id AS alumno_id,
      f.id AS fecha_id,
      p.nombre AS nombre,
      p.apellido AS apellido,
      p.documento AS documento,
      tp.descripcion AS plan,
      f.fecha_inicio AS inicio,
      f.fecha_fin AS fin,
      f.ingresos_disponibles
    FROM gym_v3.membresia f
    INNER JOIN gym_v3.alumno a ON a.id = f.alumno_id
    INNER JOIN gym_v3.persona p ON p.id = a.persona_id
    LEFT JOIN gym_v3.plan_tipo tp ON tp.id = f.plan_tipo_id
    WHERE f.fecha_fin >= CURRENT_DATE
      AND f.fecha_fin <= CURRENT_DATE + (:dias::int)
    ORDER BY f.fecha_fin ASC;
  `;

  const items = await sequelize.query(sql, { type: QueryTypes.SELECT, replacements: { dias } });
  return { items, total: items.length };
}

// Corregido: usaba gym_diaingreso_fechaingreso (typo) — ahora usa hora_ingreso correctamente
export async function obtenerAsistencias({ desde, hasta } = {}) {
  const hoy = new Date();
  const fechaDesde = desde ? new Date(desde) : new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const fechaHasta = hasta ? new Date(hasta) : new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);

  const sql = `
    SELECT
      di.fecha_ingreso AS dia,
      COUNT(*)::int AS total
    FROM gym_v3.ingreso di
    WHERE di.fecha_ingreso >= :desde::date
      AND di.fecha_ingreso < :hasta::date
    GROUP BY 1
    ORDER BY 1 ASC;
  `;

  const items = await sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: { desde: fechaDesde, hasta: fechaHasta },
  });

  return {
    items: items.map((r) => ({
      dia:   String(r.dia).slice(0, 10),
      total: Number(r.total || 0),
    })),
  };
}

// Corregido: mismo typo que obtenerAsistencias
export async function obtenerAsistenciasHoras({ desde, hasta } = {}) {
  const hoy = new Date();
  const fechaDesde = desde ? new Date(desde) : new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const fechaHasta = hasta ? new Date(hasta) : new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);

  const sql = `
    SELECT
      EXTRACT(HOUR FROM di.hora_ingreso)::int AS hora,
      COUNT(*)::int AS total
    FROM gym_v3.ingreso di
    WHERE di.fecha_ingreso >= :desde::date
      AND di.fecha_ingreso < :hasta::date
    GROUP BY 1
    ORDER BY 1 ASC;
  `;

  const rows = await sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: { desde: fechaDesde, hasta: fechaHasta },
  });

  return { items: rows };
}

export async function obtenerPlanesPopulares({ anio }) {
  // El año va como parámetro (:anio), nunca pegado en el SQL. Rango de fechas en vez de
  // EXTRACT(YEAR ...): mismo resultado y Postgres puede usar el índice de fecha_inicio.
  const filtroAnio = "AND fecha_inicio >= make_date(:anio, 1, 1) AND fecha_inicio < make_date(:anio + 1, 1, 1)";

  const sql = `
    SELECT
      COALESCE(tp.descripcion, 'Sin plan') AS plan,
      COUNT(*)::int                         AS total_ventas,
      COALESCE(SUM(m.monto_pagado::numeric), 0) AS total_recaudado
    FROM (
      SELECT plan_tipo_id, monto_pagado
      FROM public.membresia
      WHERE TRUE ${filtroAnio}
      UNION ALL
      SELECT plan_tipo_id, monto_pagado
      FROM gym_v3.membresia
      WHERE TRUE ${filtroAnio}
        AND id NOT IN (
          SELECT id FROM public.membresia
          WHERE TRUE ${filtroAnio}
        )
    ) m
    LEFT JOIN (
      SELECT id, descripcion FROM public.plan_tipo
      UNION ALL
      SELECT id, descripcion FROM gym_v3.plan_tipo
      WHERE id NOT IN (SELECT id FROM public.plan_tipo)
    ) tp ON tp.id = m.plan_tipo_id
    GROUP BY tp.descripcion
    ORDER BY total_ventas DESC;
  `;

  const rows = await sequelize.query(sql, { type: QueryTypes.SELECT, replacements: { anio } });
  return {
    items: rows.map((r) => ({
      plan:            r.plan,
      total_ventas:    Number(r.total_ventas),
      total_recaudado: Number(r.total_recaudado),
    })),
  };
}

export async function obtenerAsistenciasHoraDiaSemana({ desde, hasta } = {}) {
  const hoy = new Date();
  const fechaDesde = desde || new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
  const fechaHasta = hasta || new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().slice(0, 10);

  const sql = `
    SELECT
      EXTRACT(DOW FROM di.fecha_ingreso::date)::int AS dia_semana,
      EXTRACT(HOUR FROM di.hora_ingreso)::int       AS hora,
      COUNT(*)::int                                  AS total
    FROM gym_v3.ingreso di
    WHERE di.fecha_ingreso::date >= :desde::date
      AND di.fecha_ingreso::date <= :hasta::date
    GROUP BY 1, 2
    ORDER BY 1 ASC, 2 ASC;
  `;

  const items = await sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: { desde: fechaDesde, hasta: fechaHasta },
  });

  return { items };
}
