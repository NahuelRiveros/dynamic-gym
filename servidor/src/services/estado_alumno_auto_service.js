import { sequelize } from "../database/sequelize.js";
import { QueryTypes } from "sequelize";

const TZ_BA = "America/Argentina/Buenos_Aires";

const ESTADO = { HABILITADO: 1, RESTRINGIDO: 2, PENDIENTE: 3 };

function normalizarFechaSoloDia(fecha) {
  if (!fecha) return null;
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function hoyArgentinaSoloDia() {
  const ahora = new Date();
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ_BA, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(ahora);

  const anio = partes.find((p) => p.type === "year")?.value;
  const mes  = partes.find((p) => p.type === "month")?.value;
  const dia  = partes.find((p) => p.type === "day")?.value;

  const fecha = new Date(`${anio}-${mes}-${dia}T00:00:00`);
  fecha.setHours(0, 0, 0, 0);
  return fecha;
}

function calcularVigencia(plan_fin) {
  const fechaFin = normalizarFechaSoloDia(plan_fin);
  if (!fechaFin) return false;
  // El día de vencimiento (fecha_fin) cuenta como vigente: el alumno
  // mantiene acceso hasta el final de ese día, no hasta el día anterior.
  return fechaFin >= hoyArgentinaSoloDia();
}

function calcularNuevoEstado({ plan_fin, ingresos_disponibles }) {
  if (!calcularVigencia(plan_fin)) return ESTADO.RESTRINGIDO;
  const ing = Number(ingresos_disponibles ?? 0);
  if (!Number.isFinite(ing)) return ESTADO.RESTRINGIDO;
  return ing > 0 ? ESTADO.HABILITADO : ESTADO.RESTRINGIDO;
}

function motivoCambio({ plan_id, plan_fin, ingresos_disponibles, nuevoEstado }) {
  if (!plan_id) return "Cambio automático: alumno sin plan registrado";
  const vigente = calcularVigencia(plan_fin);
  const ing = Number(ingresos_disponibles ?? 0);
  if (nuevoEstado === ESTADO.HABILITADO) return `Cambio automático: plan vigente e ingresos disponibles (${ing})`;
  if (!vigente)                          return "Cambio automático: plan vencido";
  if (!Number.isFinite(ing))             return "Cambio automático: ingresos inválidos";
  if (ing <= 0)                          return "Cambio automático: sin ingresos disponibles";
  return "Cambio automático: estado recalculado";
}

export async function actualizarEstadosAlumnosAutomatico({
  fuente = "AUTO_CRON",
  modificado_por = null,
  limit = 5000,
} = {}) {
  const t = await sequelize.transaction();

  try {
    const sql = `
      SELECT
        a.id AS alumno_id,
        a.estado_id AS estado_actual,
        ult.id AS plan_id,
        ult.fecha_inicio AS plan_inicio,
        ult.fecha_fin AS plan_fin,
        ult.ingresos_disponibles
      FROM alumno a
      LEFT JOIN LATERAL (
        SELECT f.id, f.fecha_inicio, f.fecha_fin, f.ingresos_disponibles
        FROM membresia f
        WHERE f.alumno_id = a.id
        ORDER BY f.id DESC
        LIMIT 1
      ) ult ON TRUE
      ORDER BY a.id ASC
      LIMIT :limit;
    `;

    const alumnos = await sequelize.query(sql, {
      type: QueryTypes.SELECT,
      replacements: { limit },
      transaction: t,
    });

    const cambios = [];

    for (const row of alumnos) {
      const nuevo    = calcularNuevoEstado({ plan_fin: row.plan_fin, ingresos_disponibles: row.ingresos_disponibles });
      const anterior = Number(row.estado_actual);

      if (anterior === nuevo) continue;

      const motivo = motivoCambio({
        plan_id: row.plan_id, plan_fin: row.plan_fin,
        ingresos_disponibles: row.ingresos_disponibles, nuevoEstado: nuevo,
      });

      await sequelize.query(
        `
        UPDATE alumno
        SET estado_id = :nuevo, actualizado_en = (now() AT TIME ZONE '${TZ_BA}')
        WHERE id = :alumno_id;
        `,
        { type: QueryTypes.UPDATE, replacements: { nuevo, alumno_id: row.alumno_id }, transaction: t }
      );

      await sequelize.query(
        `
        INSERT INTO alumno_estado_log (
          alumno_id, estado_anterior_id, estado_nuevo_id, creado_en,
          motivo, fuente, modificado_por
        ) VALUES (
          :alumno_id, :anterior, :nuevo,
          (now() AT TIME ZONE '${TZ_BA}'),
          :motivo, :fuente, :modificado_por
        );
        `,
        {
          type: QueryTypes.INSERT,
          replacements: { alumno_id: row.alumno_id, anterior, nuevo, motivo, fuente, modificado_por },
          transaction: t,
        }
      );

      cambios.push({
        alumno_id:            row.alumno_id,
        estado_anterior:      anterior,
        estado_nuevo:         nuevo,
        motivo,
        plan_id:              row.plan_id,
        plan_inicio:          row.plan_inicio,
        plan_fin:             row.plan_fin,
        ingresos_disponibles: row.ingresos_disponibles,
      });
    }

    await t.commit();

    return {
      ok: true,
      total_analizados: alumnos.length,
      total_cambios:    cambios.length,
      cambios,
    };
  } catch (e) {
    await t.rollback();
    throw e;
  }
}
