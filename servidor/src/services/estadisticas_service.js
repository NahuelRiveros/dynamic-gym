import { sequelize } from "../database/sequelize.js";
import { QueryTypes } from "sequelize";
/**
 * 1) Recaudación mensual FUNCIONANDO
 */
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export async function obtenerRecaudacionMensual({ anio }) {
  // 1) Query: suma por mes (usa la fecha de inicio del plan)
  const rows = await sequelize.query(
    `
    SELECT
      EXTRACT(MONTH FROM gym_fecha_inicio)::int AS mes,
      COALESCE(SUM(gym_fecha_montopagado), 0)::float AS total,
      COUNT(*)::int AS cantidad_pagos
    FROM gym_fecha_disponible
    WHERE gym_fecha_inicio IS NOT NULL
      AND EXTRACT(YEAR FROM gym_fecha_inicio)::int = :anio
      AND COALESCE(gym_fecha_montopagado, 0) > 0
    GROUP BY 1
    ORDER BY 1 ASC;
    `,
    {
      replacements: { anio },
      type: QueryTypes.SELECT,
    }
  );

  // 2) Normalizamos: siempre devolvemos 12 meses (aunque no haya pagos)
  const map = new Map(rows.map((r) => [r.mes, r]));

  const items = Array.from({ length: 12 }, (_, i) => {
    const mesNum = i + 1;
    const r = map.get(mesNum);

    return {
      mes: mesNum,
      mes_nombre: MESES[i],
      total: Number(r?.total ?? 0),
      cantidad_pagos: Number(r?.cantidad_pagos ?? 0),
    };
  });

  const total_anual = items.reduce((acc, it) => acc + (it.total || 0), 0);

  return { total_anual, items };
}

/**
 * 2) Alumnos nuevos
 */
export async function obtenerAlumnosNuevos({ desde, hasta }) {
  const sql = `
    SELECT COUNT(*)::int AS total
    FROM gym_alumno a
    WHERE a.gym_alumno_fecharegistro BETWEEN :desde::date AND :hasta::date;
  `;

  const [row] = await sequelize.query(sql, {
    replacements: { desde, hasta },
    type: sequelize.QueryTypes.SELECT,
  });

  return { total: row?.total ?? 0 };
}

/**
 * 3) Vencimientos próximos N días
 */
export async function obtenerVencimientosProximos({ dias }) {
  const sql = `
    SELECT
      p.gym_persona_id AS persona_id,
      p.gym_persona_nombre AS nombre,
      p.gym_persona_apellido AS apellido,
      p.gym_persona_documento AS documento,
      a.gym_alumno_id AS alumno_id,
      f.gym_fecha_id AS fecha_id,
      f.gym_fecha_inicio AS inicio,
      f.gym_fecha_fin AS fin,
      f.gym_fecha_ingresosdisponibles AS ingresos_disponibles,
      tp.gym_cat_tipoplan_descripcion AS plan
    FROM gym_fecha_disponible f
    JOIN gym_alumno a ON a.gym_alumno_id = f.gym_fecha_rela_alumno
    JOIN gym_persona p ON p.gym_persona_id = a.gym_alumno_rela_persona
    LEFT JOIN gym_cat_tipoplan tp ON tp.gym_cat_tipoplan_id = f.gym_fecha_rela_tipoplan
    WHERE f.gym_fecha_fin IS NOT NULL
      AND f.gym_fecha_fin BETWEEN CURRENT_DATE AND (CURRENT_DATE + (:dias || ' days')::interval)
    ORDER BY f.gym_fecha_fin ASC;
  `;

  const rows = await sequelize.query(sql, {
    replacements: { dias },
    type: sequelize.QueryTypes.SELECT,
  });

  return { total: rows.length, items: rows };
}

/**
 * 4) Asistencias: total, por día, top alumnos
 */
export async function obtenerAsistencias({ desde, hasta }) {
  const sqlTotal = `
    SELECT COUNT(*)::int AS total
    FROM gym_dia_ingreso di
    WHERE di.gym_dia_fechaingreso BETWEEN :desde::date AND :hasta::date;
  `;

  const sqlPorDia = `
    SELECT
      di.gym_dia_fechaingreso AS fecha,
      COUNT(*)::int AS cantidad
    FROM gym_dia_ingreso di
    WHERE di.gym_dia_fechaingreso BETWEEN :desde::date AND :hasta::date
    GROUP BY 1
    ORDER BY 1;
  `;

  const sqlTop = `
    SELECT
      p.gym_persona_id AS persona_id,
      p.gym_persona_nombre AS nombre,
      p.gym_persona_apellido AS apellido,
      p.gym_persona_documento AS documento,
      COUNT(*)::int AS ingresos
    FROM gym_dia_ingreso di
    JOIN gym_fecha_disponible f ON f.gym_fecha_id = di.gym_dia_rela_fecha
    JOIN gym_alumno a ON a.gym_alumno_id = f.gym_fecha_rela_alumno
    JOIN gym_persona p ON p.gym_persona_id = a.gym_alumno_rela_persona
    WHERE di.gym_dia_fechaingreso BETWEEN :desde::date AND :hasta::date
    GROUP BY 1,2,3,4
    ORDER BY ingresos DESC
    LIMIT 10;
  `;

  const [[totalRow], porDia, top] = await Promise.all([
    sequelize.query(sqlTotal, {
      replacements: { desde, hasta },
      type: sequelize.QueryTypes.SELECT,
    }),
    sequelize.query(sqlPorDia, {
      replacements: { desde, hasta },
      type: sequelize.QueryTypes.SELECT,
    }),
    sequelize.query(sqlTop, {
      replacements: { desde, hasta },
      type: sequelize.QueryTypes.SELECT,
    }),
  ]);

  return {
    total_ingresos: totalRow?.total ?? 0,
    ingresos_por_dia: porDia,
    top_alumnos: top,
  };
}

/**
 * 5) Asistencias por hora (hora pico)
 */
export async function obtenerAsistenciasPorHora({ desde, hasta }) {
  const sql = `
    SELECT
      date_part('hour', di.gym_dia_horaingreso)::int AS hora,
      COUNT(*)::int AS cantidad
    FROM gym_dia_ingreso di
    WHERE di.gym_dia_fechaingreso BETWEEN :desde::date AND :hasta::date
    GROUP BY hora
    ORDER BY hora;
  `;

  const rows = await sequelize.query(sql, {
    replacements: { desde, hasta },
    type: sequelize.QueryTypes.SELECT,
  });

  let pico = null;
  if (rows.length) {
    pico = rows.reduce((best, cur) => (cur.cantidad > best.cantidad ? cur : best));
  }

  return {
    items: rows,
    hora_pico: pico?.hora ?? null,
    cantidad_pico: pico?.cantidad ?? 0,
  };
}

/**
 * 6) Hora pico por día de semana (para heatmap)
 */
export async function obtenerAsistenciasHoraDiaSemana({ desde, hasta }) {
  const sql = `
    SELECT
      date_part('dow', di.gym_dia_horaingreso)::int AS dow,
      date_part('hour', di.gym_dia_horaingreso)::int AS hora,
      COUNT(*)::int AS cantidad
    FROM gym_dia_ingreso di
    WHERE di.gym_dia_fechaingreso BETWEEN :desde::date AND :hasta::date
    GROUP BY dow, hora
    ORDER BY dow, hora;
  `;

  const rows = await sequelize.query(sql, {
    replacements: { desde, hasta },
    type: sequelize.QueryTypes.SELECT,
  });

  // pico global (día+hora)
  let pico = null;
  if (rows.length) {
    pico = rows.reduce((best, cur) => (cur.cantidad > best.cantidad ? cur : best));
  }

  return {
    items: rows,
    pico: pico ? { dow: pico.dow, hora: pico.hora, cantidad: pico.cantidad } : null,
  };
}


/**
 * 6) Hora pico por día de semana (para heatmap)
 */

// FUNCIONANDO


export async function obtenerRecaudacionDiariaMes({ anio, mes }) {
  const desde = new Date(anio, mes - 1, 1);
  const hasta = new Date(anio, mes, 1);

  const sql = `
    SELECT
      gym_fecha_inicio AS dia,
      COALESCE(SUM(gym_fecha_montopagado::numeric), 0) AS total
    FROM gym_fecha_disponible
    WHERE gym_fecha_inicio >= :desde::date
      AND gym_fecha_inicio < :hasta::date
    GROUP BY 1
    ORDER BY 1 ASC
  `;

  const items = await sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: { desde, hasta },
  });

  return {
    items: items.map((r) => ({
      dia: String(r.dia).slice(0, 10),
      total: Number(r.total || 0),
    })),
  };
}
