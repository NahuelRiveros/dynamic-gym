// src/services/ingresos_service.js
import { QueryTypes, Op } from "sequelize";
import { sequelize } from "../database/sequelize.js";
import {
  GymPersona,
  GymAlumno,
  GymFechaDisponible,
  GymCatTipoPlan,
} from "../models/index.js";

const TZ_BA = "America/Argentina/Buenos_Aires";

const ESTADO_HABILITADO = 1;
const ESTADO_RESTRINGIDO = 2;

const normalizarDocumento = (doc) =>
  String(doc ?? "").replace(/[.\s]/g, "").trim();

function hoyArgentinaISO() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ_BA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function registrarIngresoPorDni({ dni }) {
  const dniNormalizado = normalizarDocumento(dni);
  const dniNum = Number(dniNormalizado);
  const hoy = hoyArgentinaISO();

  if (!Number.isFinite(dniNum) || dniNum <= 0) {
    return { ok: false, codigo: "VALIDACION", mensaje: "Documento inválido" };
  }

  return sequelize.transaction(async (t) => {
    const persona = await GymPersona.findOne({
      where: { gym_persona_documento: dniNum },
      transaction: t,
    });

    if (!persona) {
      return {
        ok: false,
        codigo: "NO_EXISTE",
        mensaje: "No existe una persona con ese documento",
      };
    }

    const alumno = await GymAlumno.findOne({
      where: { gym_alumno_rela_persona: persona.gym_persona_id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!alumno) {
      return {
        ok: false,
        codigo: "NO_ES_ALUMNO",
        mensaje: "La persona existe pero no es alumno",
      };
    }

    // Buscar último plan vigente, igual que en Python
    const planReciente = await GymFechaDisponible.findOne({
      where: {
        gym_fecha_rela_alumno: alumno.gym_alumno_id,
        gym_fecha_fin: {
          [Op.gte]: hoy,
        },
      },
      order: [
        ["gym_fecha_fin", "DESC"],
        ["gym_fecha_id", "DESC"],
      ],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    console.log(
      "PLAN VIGENTE ENCONTRADO:",
      planReciente
        ? {
            fecha_id: planReciente.gym_fecha_id,
            inicio: planReciente.gym_fecha_inicio,
            fin: planReciente.gym_fecha_fin,
            ingresos_disponibles: planReciente.gym_fecha_ingresosdisponibles,
            tipo_plan: planReciente.gym_fecha_rela_tipoplan,
          }
        : "NO ENCONTRADO"
    );

    if (!planReciente) {
      if (Number(alumno.gym_alumno_rela_estadoalumno) !== ESTADO_RESTRINGIDO) {
        await alumno.update(
          { gym_alumno_rela_estadoalumno: ESTADO_RESTRINGIDO },
          { transaction: t }
        );
      }

      return {
        ok: false,
        codigo: "PLAN_VENCIDO_O_INEXISTENTE",
        mensaje: "El alumno no tiene un plan vigente",
        alumno: {
          alumno_id: alumno.gym_alumno_id,
          estado_id: ESTADO_RESTRINGIDO,
        },
      };
    }

    const ingresosActuales = Number(
      planReciente.gym_fecha_ingresosdisponibles ?? 0
    );

    if (ingresosActuales <= 0) {
      if (Number(alumno.gym_alumno_rela_estadoalumno) !== ESTADO_RESTRINGIDO) {
        await alumno.update(
          { gym_alumno_rela_estadoalumno: ESTADO_RESTRINGIDO },
          { transaction: t }
        );
      }

      return {
        ok: false,
        codigo: "SIN_INGRESOS",
        mensaje: "Alumno sin ingresos disponibles",
        alumno: {
          alumno_id: alumno.gym_alumno_id,
          estado_id: ESTADO_RESTRINGIDO,
        },
        plan: {
          fecha_id: planReciente.gym_fecha_id,
          inicio: planReciente.gym_fecha_inicio,
          fin: planReciente.gym_fecha_fin,
          ingresos_restantes: 0,
        },
      };
    }

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
        (now() AT TIME ZONE '${TZ_BA}'),
        (now() AT TIME ZONE '${TZ_BA}')
      )
      RETURNING
        gym_dia_id,
        gym_dia_fechaingreso,
        gym_dia_horaingreso,
        gym_dia_fechacambio
      `,
      {
        replacements: { fecha_id: planReciente.gym_fecha_id },
        type: QueryTypes.INSERT,
        transaction: t,
      }
    );

    const ingresoDB = Array.isArray(rows) ? rows[0] : rows;

    const ingresosRestantes = ingresosActuales - 1;

    await sequelize.query(
      `
      UPDATE gym_fecha_disponible
      SET gym_fecha_ingresosdisponibles = :restantes,
          gym_fecha_fechacambio = (now() AT TIME ZONE '${TZ_BA}')
      WHERE gym_fecha_id = :fecha_id
      `,
      {
        replacements: {
          restantes: ingresosRestantes,
          fecha_id: planReciente.gym_fecha_id,
        },
        type: QueryTypes.UPDATE,
        transaction: t,
      }
    );

    let estadoFinal = Number(alumno.gym_alumno_rela_estadoalumno);

    if (estadoFinal === ESTADO_RESTRINGIDO && ingresosRestantes > 0) {
      await alumno.update(
        { gym_alumno_rela_estadoalumno: ESTADO_HABILITADO },
        { transaction: t }
      );
      estadoFinal = ESTADO_HABILITADO;
    }

    if (ingresosRestantes === 0) {
      await alumno.update(
        { gym_alumno_rela_estadoalumno: ESTADO_RESTRINGIDO },
        { transaction: t }
      );
      estadoFinal = ESTADO_RESTRINGIDO;
    }

    let tipoPlanDesc = null;
    if (planReciente.gym_fecha_rela_tipoplan) {
      const tipoPlan = await GymCatTipoPlan.findByPk(
        planReciente.gym_fecha_rela_tipoplan,
        { transaction: t }
      );
      tipoPlanDesc = tipoPlan?.gym_cat_tipoplan_descripcion ?? null;
    }

    return {
      ok: true,
      codigo: "OK",
      mensaje:
        ingresosRestantes === 0
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
        fecha_id: planReciente.gym_fecha_id,
        inicio: planReciente.gym_fecha_inicio,
        fin: planReciente.gym_fecha_fin,
        tipo_plan: tipoPlanDesc,
        ingresos_restantes: ingresosRestantes,
      },
      fecha_ingreso: ingresoDB?.gym_dia_horaingreso ?? null,
    };
  });
}