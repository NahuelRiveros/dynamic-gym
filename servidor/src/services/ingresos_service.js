import { Op, QueryTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";
import {
  GymPersona,
  GymAlumno,
  GymFechaDisponible,
  GymCatTipoPlan,
} from "../models/index.js";

const ESTADO_RESTRINGIDO = 2;

const normalizarDocumento = (doc) => String(doc).replace(/[.\s]/g, "").trim();

/**
 * YYYY-MM-DD en Argentina (para comparar con gym_fecha_inicio/fin)
 */
function hoyArgentinaISO() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function registrarIngresoPorDni({ dni }) {
  const dniNormalizado = normalizarDocumento(dni);
  const hoy = hoyArgentinaISO();

  return sequelize.transaction(async (t) => {
    // 1) Persona
    const persona = await GymPersona.findOne({
      where: { gym_persona_documento: dniNormalizado },
      transaction: t,
    });

    if (!persona) {
      return { ok: false, codigo: "NO_EXISTE", mensaje: "No existe una persona con ese documento" };
    }

    // 2) Alumno (lock)
    const alumno = await GymAlumno.findOne({
      where: { gym_alumno_rela_persona: persona.gym_persona_id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!alumno) {
      return { ok: false, codigo: "NO_ES_ALUMNO", mensaje: "La persona existe pero no es alumno" };
    }

    // Restringido
    if (alumno.gym_alumno_rela_estadoalumno === ESTADO_RESTRINGIDO) {
      return {
        ok: false,
        codigo: "RESTRINGIDO",
        mensaje: "Alumno restringido: no tiene ingresos disponibles",
        alumno: { alumno_id: alumno.gym_alumno_id, estado_id: alumno.gym_alumno_rela_estadoalumno },
      };
    }

    // 3) Plan vigente (lock)
    const planVigente = await GymFechaDisponible.findOne({
      where: {
        gym_fecha_rela_alumno: alumno.gym_alumno_id,
        gym_fecha_inicio: { [Op.lte]: hoy },
        gym_fecha_fin: { [Op.gte]: hoy },
      },
      order: [
        ["gym_fecha_fin", "DESC"],
        ["gym_fecha_id", "DESC"],
      ],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!planVigente) {
      return {
        ok: false,
        codigo: "VENCIDO",
        mensaje: "Alumno sin plan vigente",
        alumno: { alumno_id: alumno.gym_alumno_id, estado_id: alumno.gym_alumno_rela_estadoalumno },
      };
    }

    // 4) Validar ingresos
    const ingresosActuales = Number(planVigente.gym_fecha_ingresosdisponibles || 0);

    if (ingresosActuales <= 0) {
      await alumno.update(
        { gym_alumno_rela_estadoalumno: ESTADO_RESTRINGIDO },
        { transaction: t }
      );

      return {
        ok: false,
        codigo: "SIN_INGRESOS",
        mensaje: "Alumno sin ingresos disponibles",
        alumno: { alumno_id: alumno.gym_alumno_id, estado_id: ESTADO_RESTRINGIDO },
        plan: { fecha_id: planVigente.gym_fecha_id, ingresos_restantes: 0, fin: planVigente.gym_fecha_fin },
      };
    }

    // ✅ 5) Insert ingreso: LA HORA LA PONE POSTGRES (Argentina)
    const [rows] = await sequelize.query(
      `
      INSERT INTO gym_dia_ingreso (
        gym_dia_rela_fecha,
        gym_dia_fechaingreso,
        gym_dia_horaingreso,
        gym_dia_fechacambio
      )
      VALUES (
        :fecha_id,
        CURRENT_DATE,
        (now() AT TIME ZONE 'America/Argentina/Buenos_Aires'),
        (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')
      )
      RETURNING
        gym_dia_id,
        gym_dia_fechaingreso,
        gym_dia_horaingreso,
        gym_dia_fechacambio
      `,
      {
        replacements: { fecha_id: planVigente.gym_fecha_id },
        type: QueryTypes.INSERT,
        transaction: t,
      }
    );

    // En postgres con sequelize suele venir: rows[0] = objeto
    const ingresoDB = Array.isArray(rows) ? rows[0] : rows;

    // 6) Descontar ingresos (y fecha cambio con PG también)
    const ingresosRestantes = ingresosActuales - 1;

    await sequelize.query(
      `
      UPDATE gym_fecha_disponible
      SET gym_fecha_ingresosdisponibles = :restantes,
          gym_fecha_fechacambio = (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')
      WHERE gym_fecha_id = :fecha_id
      `,
      {
        replacements: {
          restantes: ingresosRestantes,
          fecha_id: planVigente.gym_fecha_id,
        },
        type: QueryTypes.UPDATE,
        transaction: t,
      }
    );

    // 7) Si quedó 0 => restringido
    let estadoFinal = alumno.gym_alumno_rela_estadoalumno;

    if (ingresosRestantes === 0) {
      await alumno.update(
        { gym_alumno_rela_estadoalumno: ESTADO_RESTRINGIDO },
        { transaction: t }
      );
      estadoFinal = ESTADO_RESTRINGIDO;
    }

    // 8) Tipo plan (sin lock)
    let tipoPlanDesc = null;
    if (planVigente.gym_fecha_rela_tipoplan) {
      const tipoPlan = await GymCatTipoPlan.findByPk(planVigente.gym_fecha_rela_tipoplan, {
        transaction: t,
      });
      tipoPlanDesc = tipoPlan?.gym_cat_tipoplan_descripcion ?? null;
    }

    return {
      ok: true,
      codigo: "OK",
      mensaje: ingresosRestantes === 0
        ? "Ingreso registrado - alumno quedó restringido"
        : "Ingreso registrado",
      alumno: {
        alumno_id: alumno.gym_alumno_id,
        persona_id: persona.gym_persona_id,
        nombre: persona.gym_persona_nombre,
        apellido: persona.gym_persona_apellido,
        documento: persona.gym_persona_documento,
        estado_id: estadoFinal,
      },
      plan: {
        fecha_id: planVigente.gym_fecha_id,
        inicio: planVigente.gym_fecha_inicio,
        fin: planVigente.gym_fecha_fin,
        tipo_plan: tipoPlanDesc,
        ingresos_restantes: ingresosRestantes,
      },
      // ✅ devolvemos lo que guardó PG
      fecha_ingreso: ingresoDB?.gym_dia_horaingreso ?? null,
    };
  });
}