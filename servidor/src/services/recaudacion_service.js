import { sequelize } from "../database/sequelize.js";
import { QueryTypes } from "sequelize";

function validarAnioMesDia({ anio, mes, dia = null }) {
  if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) throw new Error("ANIO_INVALIDO");
  if (!Number.isInteger(mes)  || mes < 1    || mes > 12)    throw new Error("MES_INVALIDO");
  if (dia !== null && (!Number.isInteger(dia) || dia < 1 || dia > 31)) throw new Error("DIA_INVALIDO");
}

export async function obtenerRecaudacionMesesPorAnio({ anio }) {
  if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) throw new Error("ANIO_INVALIDO");

  const sql = `
    SELECT
      EXTRACT(MONTH FROM f.fecha_inicio)::int AS mes,
      COALESCE(SUM(f.monto_pagado::numeric), 0) AS total
    FROM membresia f
    WHERE EXTRACT(YEAR FROM f.fecha_inicio) = :anio
      AND COALESCE(f.monto_pagado, 0) > 0
    GROUP BY 1
    ORDER BY 1 ASC;
  `;

  const rows = await sequelize.query(sql, { type: QueryTypes.SELECT, replacements: { anio } });

  const items = Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, total: 0 }));
  for (const row of rows) {
    const mes = Number(row.mes);
    if (mes >= 1 && mes <= 12) items[mes - 1].total = Number(row.total || 0);
  }

  return { items };
}

export async function obtenerRecaudacionDiasDeMes({ anio, mes }) {
  validarAnioMesDia({ anio, mes });

  const desde = `${anio}-${String(mes).padStart(2, "0")}-01`;
  const hasta = new Date(anio, mes, 1).toISOString().slice(0, 10);

  const sql = `
    SELECT
      f.fecha_inicio AS dia,
      COALESCE(SUM(f.monto_pagado::numeric), 0) AS total
    FROM membresia f
    WHERE f.fecha_inicio >= :desde::date
      AND f.fecha_inicio < :hasta::date
      AND COALESCE(f.monto_pagado, 0) > 0
    GROUP BY 1
    ORDER BY 1 ASC;
  `;

  const rows = await sequelize.query(sql, { type: QueryTypes.SELECT, replacements: { desde, hasta } });

  return {
    items: rows.map((row) => ({
      dia:   String(row.dia).slice(0, 10),
      total: Number(row.total || 0),
    })),
  };
}

export async function obtenerDetalleRecaudacionDia({ anio, mes, dia }) {
  validarAnioMesDia({ anio, mes, dia });

  const fecha = `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

  const sql = `
    SELECT
      f.id AS gym_fecha_id,
      f.fecha_inicio,
      f.actualizado_en AS gym_fecha_fechacambio,
      f.monto_pagado AS gym_fecha_montopagado,
      f.metodo_pago AS gym_fecha_metodopago,

      p_alumno.nombre AS alumno_nombre,
      p_alumno.apellido AS alumno_apellido,
      p_alumno.documento AS alumno_documento,

      tp.descripcion AS plan_descripcion,

      p_usuario.nombre AS usuario_nombre,
      p_usuario.apellido AS usuario_apellido
    FROM membresia f
    LEFT JOIN alumno a ON a.id = f.alumno_id
    LEFT JOIN persona p_alumno ON p_alumno.id = a.persona_id
    LEFT JOIN plan_tipo tp ON tp.id = f.plan_tipo_id
    LEFT JOIN usuario u ON u.id = f.cobrado_por_id
    LEFT JOIN persona p_usuario ON p_usuario.id = u.persona_id
    WHERE f.fecha_inicio = :fecha::date
      AND COALESCE(f.monto_pagado, 0) > 0
    ORDER BY f.actualizado_en ASC NULLS LAST, f.id ASC;
  `;

  const rows = await sequelize.query(sql, { type: QueryTypes.SELECT, replacements: { fecha } });

  const items = rows.map((row) => ({
    gym_fecha_id:    row.gym_fecha_id,
    fecha_inicio:    row.fecha_inicio,
    fecha_hora:      row.gym_fecha_fechacambio,
    monto:           Number(row.gym_fecha_montopagado || 0),
    metodo_pago:     row.gym_fecha_metodopago || null,
    alumno:          [row.alumno_nombre, row.alumno_apellido].filter(Boolean).join(" "),
    alumno_documento: row.alumno_documento || null,
    plan:            row.plan_descripcion || null,
    usuario_cobro:   [row.usuario_nombre, row.usuario_apellido].filter(Boolean).join(" "),
  }));

  return {
    total_dia:       items.reduce((acc, item) => acc + Number(item.monto || 0), 0),
    cantidad_cobros: items.length,
    items,
  };
}
