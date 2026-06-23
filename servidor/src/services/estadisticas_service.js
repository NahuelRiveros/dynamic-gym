import { sequelize } from "../database/sequelize.js";
import { QueryTypes } from "sequelize";

const TZ_AR = "America/Argentina/Cordoba";

function armarRangoMes(anio, mes) {
  const desde = new Date(anio, mes - 1, 1);
  const hasta = new Date(anio, mes, 1);
  return { desde, hasta };
}

export async function obtenerRecaudacionMensual({ anio }) {
  const sql = `
    SELECT
      EXTRACT(MONTH FROM fecha_inicio)::int AS mes,
      COALESCE(SUM(monto_pagado::numeric), 0) AS total
    FROM gym_v3.vista_recaudacion_completa
    WHERE EXTRACT(YEAR FROM fecha_inicio) = :anio
      AND COALESCE(monto_pagado, 0) > 0
    GROUP BY 1
    ORDER BY 1 ASC;
  `;

  const rows = await sequelize.query(sql, { type: QueryTypes.SELECT, replacements: { anio } });

  const items = Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, total: 0 }));
  for (const r of rows) {
    const mes = Number(r.mes);
    if (mes >= 1 && mes <= 12) items[mes - 1].total = Number(r.total || 0);
  }

  return { items };
}

export async function obtenerRecaudacionDiariaMes({ anio, mes }) {
  const { desde, hasta } = armarRangoMes(anio, mes);

  const sql = `
    SELECT
      fecha_inicio AS dia,
      COALESCE(SUM(monto_pagado::numeric), 0) AS total
    FROM gym_v3.vista_recaudacion_completa
    WHERE fecha_inicio >= :desde::date
      AND fecha_inicio < :hasta::date
      AND COALESCE(monto_pagado, 0) > 0
    GROUP BY 1
    ORDER BY 1 ASC;
  `;

  const rows = await sequelize.query(sql, { type: QueryTypes.SELECT, replacements: { desde, hasta } });

  return {
    items: rows.map((r) => ({
      dia:   String(r.dia).slice(0, 10),
      total: Number(r.total || 0),
    })),
  };
}

export async function obtenerRecaudacionDetalleDia({ anio, mes, dia }) {
  const fecha = `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

  const sql = `
    SELECT
      f.id AS gym_fecha_id,
      f.fecha_inicio,
      f.actualizado_en AS fecha_hora,
      f.monto_pagado AS monto,
      f.metodo_pago,
      p_alumno.nombre AS alumno_nombre,
      p_alumno.apellido AS alumno_apellido,
      p_alumno.documento::text AS alumno_documento,
      tp.descripcion AS plan_descripcion,
      p_usuario.nombre AS usuario_nombre,
      p_usuario.apellido AS usuario_apellido
    FROM (
      SELECT id, alumno_id, plan_tipo_id, cobrado_por_id,
             monto_pagado, fecha_inicio, actualizado_en, metodo_pago
      FROM public.membresia
      WHERE fecha_inicio = :fecha::date AND COALESCE(monto_pagado, 0) > 0
      UNION ALL
      SELECT id, alumno_id, plan_tipo_id, cobrado_por_id,
             monto_pagado, fecha_inicio, actualizado_en, metodo_pago
      FROM gym_v3.membresia
      WHERE fecha_inicio = :fecha::date AND COALESCE(monto_pagado, 0) > 0
        AND id NOT IN (SELECT id FROM public.membresia WHERE fecha_inicio = :fecha::date)
    ) f
    LEFT JOIN (
      SELECT a.id, a.persona_id FROM public.alumno a
      UNION ALL
      SELECT a.id, a.persona_id FROM gym_v3.alumno a WHERE a.id NOT IN (SELECT id FROM public.alumno)
    ) a ON a.id = f.alumno_id
    LEFT JOIN (
      SELECT p.id, p.nombre, p.apellido, p.documento::text AS documento FROM public.persona p
      UNION ALL
      SELECT p.id, p.nombre, p.apellido, p.documento FROM gym_v3.persona p WHERE p.id NOT IN (SELECT id FROM public.persona)
    ) p_alumno ON p_alumno.id = a.persona_id
    LEFT JOIN (
      SELECT pt.id, pt.descripcion FROM public.plan_tipo pt
      UNION ALL
      SELECT pt.id, pt.descripcion FROM gym_v3.plan_tipo pt WHERE pt.id NOT IN (SELECT id FROM public.plan_tipo)
    ) tp ON tp.id = f.plan_tipo_id
    LEFT JOIN (
      SELECT u.id, u.persona_id FROM public.usuario u
      UNION ALL
      SELECT u.id, u.persona_id FROM gym_v3.usuario u WHERE u.id NOT IN (SELECT id FROM public.usuario)
    ) u ON u.id = f.cobrado_por_id
    LEFT JOIN (
      SELECT p.id, p.nombre, p.apellido FROM public.persona p
      UNION ALL
      SELECT p.id, p.nombre, p.apellido FROM gym_v3.persona p WHERE p.id NOT IN (SELECT id FROM public.persona)
    ) p_usuario ON p_usuario.id = u.persona_id
    ORDER BY f.actualizado_en ASC NULLS LAST, f.id ASC;
  `;

  const rows = await sequelize.query(sql, { type: QueryTypes.SELECT, replacements: { fecha } });

  const items = rows.map((r) => ({
    gym_fecha_id:    r.gym_fecha_id,
    fecha_inicio:    r.fecha_inicio,
    fecha_hora:      r.fecha_hora,
    monto:           Number(r.monto || 0),
    metodo_pago:     r.metodo_pago || null,
    alumno:          [r.alumno_nombre, r.alumno_apellido].filter(Boolean).join(" "),
    alumno_documento: r.alumno_documento || null,
    plan:            r.plan_descripcion || null,
    usuario_cobro:   [r.usuario_nombre, r.usuario_apellido].filter(Boolean).join(" "),
  }));

  return {
    total_dia:      items.reduce((acc, it) => acc + Number(it.monto || 0), 0),
    cantidad_cobros: items.length,
    items,
  };
}

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

export async function obtenerPlanesPopulares({ anio } = {}) {
  const anioNum = anio ? Number.parseInt(anio, 10) : null;
  if (anioNum !== null && (!Number.isFinite(anioNum) || anioNum < 2000 || anioNum > 2100)) {
    throw new Error("Año inválido");
  }

  const filtroAnio = anioNum ? `AND EXTRACT(YEAR FROM fecha_inicio) = ${anioNum}` : "";

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

  const rows = await sequelize.query(sql, { type: QueryTypes.SELECT });
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
