// src/services/estado_alumno_auto_service.js
import { sequelize } from "../database/sequelize.js";
import { QueryTypes } from "sequelize";

const TZ_BA = "America/Argentina/Buenos_Aires";

const ESTADO = {
  HABILITADO: 1,
  RESTRINGIDO: 2,
  PENDIENTE: 3,
};

// ✅ Regla:
// - HABILITADO: tiene plan ACTIVO (según tu query: fin >= hoy BA) y ingresos_disponibles > 0
// - RESTRINGIDO: caso contrario
function calcularNuevoEstado({ tiene_plan_activo, ingresos_disponibles }) {
  if (!tiene_plan_activo) return ESTADO.RESTRINGIDO;

  const ing = Number(ingresos_disponibles ?? 0);
  if (!Number.isFinite(ing)) return ESTADO.RESTRINGIDO;

  return ing > 0 ? ESTADO.HABILITADO : ESTADO.RESTRINGIDO;
}

function motivoCambio({ tiene_plan_activo, ingresos_disponibles, nuevoEstado }) {
  const ing = Number(ingresos_disponibles ?? 0);

  if (nuevoEstado === ESTADO.HABILITADO) {
    return `Cambio automático: plan activo e ingresos disponibles (${ing})`;
  }

  if (!tiene_plan_activo) return "Cambio automático: sin plan activo (fin vencido)";
  if (!Number.isFinite(ing)) return "Cambio automático: ingresos inválidos";
  return "Cambio automático: sin ingresos disponibles";
}

export async function actualizarEstadosAlumnosAutomatico({
  fuente = "AUTO_CRON",
  modificado_por = "SYSTEM",
  limit = 5000,
} = {}) {
  const t = await sequelize.transaction();

  try {
    // ✅ Plan ACTIVO por tu regla actual: fin >= hoy BA
    // Elegimos el más reciente por ID DESC
    const sql = `
      SELECT
        a.gym_alumno_id AS alumno_id,
        a.gym_alumno_rela_estadoalumno AS estado_actual,

        fact.gym_fecha_id AS plan_activo_id,
        fact.gym_fecha_inicio AS plan_inicio,
        fact.gym_fecha_fin AS plan_fin,
        fact.gym_fecha_ingresosdisponibles AS ingresos_disponibles
      FROM gym_alumno a

      LEFT JOIN LATERAL (
        SELECT
          f.gym_fecha_id,
          f.gym_fecha_inicio,
          f.gym_fecha_fin,
          f.gym_fecha_ingresosdisponibles
        FROM gym_fecha_disponible f
        WHERE f.gym_fecha_rela_alumno = a.gym_alumno_id
          AND f.gym_fecha_fin >= ((now() AT TIME ZONE '${TZ_BA}')::date)
        ORDER BY f.gym_fecha_id DESC
        LIMIT 1
      ) fact ON TRUE

      LIMIT :limit;
    `;

    const alumnos = await sequelize.query(sql, {
      type: QueryTypes.SELECT,
      replacements: { limit },
      transaction: t,
    });

    const cambios = [];

    for (const row of alumnos) {
      // ✅ OJO: ahora el campo correcto es plan_activo_id
      const tiene_plan_activo = row.plan_activo_id != null;

      const nuevo = calcularNuevoEstado({
        tiene_plan_activo,
        ingresos_disponibles: row.ingresos_disponibles,
      });

      const anterior = Number(row.estado_actual);
      if (anterior === nuevo) continue;

      const motivo = motivoCambio({
        tiene_plan_activo,
        ingresos_disponibles: row.ingresos_disponibles,
        nuevoEstado: nuevo,
      });

      // ✅ Update alumno (AR timezone)
      await sequelize.query(
        `
        UPDATE gym_alumno
        SET gym_alumno_rela_estadoalumno = :nuevo,
            gym_alumno_fechacambio = (now() AT TIME ZONE '${TZ_BA}')
        WHERE gym_alumno_id = :alumno_id;
        `,
        {
          type: QueryTypes.UPDATE,
          replacements: { nuevo, alumno_id: row.alumno_id },
          transaction: t,
        }
      );

      // ✅ Log
      await sequelize.query(
        `
        INSERT INTO gym_log_estado_alumno (
          gym_log_estadoalumno_rela_alumno,
          gym_log_estadoalumno_estado_anterior,
          gym_log_estadoalumno_estado_nuevo,
          gym_log_estadoalumno_fechacambio,
          gym_log_estadoalumno_motivo,
          gym_log_estadoalumno_fuente,
          gym_log_estadoalumno_modificado_por
        ) VALUES (
          :alumno_id,
          :anterior,
          :nuevo,
          (now() AT TIME ZONE '${TZ_BA}'),
          :motivo,
          :fuente,
          :modificado_por
        );
        `,
        {
          type: QueryTypes.INSERT,
          replacements: {
            alumno_id: row.alumno_id,
            anterior,
            nuevo,
            motivo,
            fuente,
            modificado_por,
          },
          transaction: t,
        }
      );

      cambios.push({
        alumno_id: row.alumno_id,
        estado_anterior: anterior,
        estado_nuevo: nuevo,
        motivo,
        plan_activo_id: row.plan_activo_id,
        plan_inicio: row.plan_inicio,
        plan_fin: row.plan_fin,
        ingresos_disponibles: row.ingresos_disponibles,
      });
    }

    await t.commit();

    return {
      ok: true,
      total_analizados: alumnos.length,
      total_cambios: cambios.length,
      cambios,
    };
  } catch (e) {
    await t.rollback();
    throw e;
  }
}