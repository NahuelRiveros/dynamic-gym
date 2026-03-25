import { QueryTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";
import {
  GymPersona,
  GymAlumno,
  GymFechaDisponible,
  GymCatTipoPlan,
  GymCatEstadoAlumno
} from "../models/index.js";

const ESTADO_HABILITADO = 1;
const ESTADO_RESTRINGIDO = 2;

function normalizarDocumento(doc) {
  return String(doc ?? "").replace(/[.\s]/g, "").trim();
}

export async function obtenerPlanVigentePorDni({ documento }) {
  const dni = Number(normalizarDocumento(documento));

  if (!Number.isFinite(dni) || dni <= 0) {
    return {
      ok: false,
      codigo: "VALIDACION",
      mensaje: "Documento inválido",
    };
  }

  const persona = await GymPersona.findOne({
    where: { gym_persona_documento: dni },
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
  });

  if (!alumno) {
    return {
      ok: false,
      codigo: "NO_ES_ALUMNO",
      mensaje: "La persona existe pero no es alumno",
    };
  }

  const plan = await GymFechaDisponible.findOne({
    where: { gym_fecha_rela_alumno: alumno.gym_alumno_id },
    order: [
      ["gym_fecha_fin", "DESC"],
      ["gym_fecha_id", "DESC"],
    ],
  });

  if (!plan) {
    return {
      ok: false,
      codigo: "PLAN_NO_EXISTE",
      mensaje: "El alumno no tiene plan registrado",
    };
  }

  const tipoPlan = plan.gym_fecha_rela_tipoplan
    ? await GymCatTipoPlan.findByPk(plan.gym_fecha_rela_tipoplan)
    : null;

  const estadoAlumno = alumno.gym_alumno_rela_estadoalumno
    ? await GymCatEstadoAlumno.findByPk(alumno.gym_alumno_rela_estadoalumno)
    : null;

  return {
    ok: true,
    alumno: {
      alumno_id: alumno.gym_alumno_id,
      persona_id: persona.gym_persona_id,
      nombre: persona.gym_persona_nombre,
      apellido: persona.gym_persona_apellido,
      documento: persona.gym_persona_documento,
      estado_id: alumno.gym_alumno_rela_estadoalumno,
      estado_desc:
        estadoAlumno?.gym_cat_estadoalumno_descripcion ?? null,
    },
    plan: {
      fecha_id: plan.gym_fecha_id,
      tipo_plan_id: plan.gym_fecha_rela_tipoplan,
      tipo_plan: tipoPlan?.gym_cat_tipoplan_descripcion ?? null,
      inicio: plan.gym_fecha_inicio,
      fin: plan.gym_fecha_fin,
      monto_pagado: plan.gym_fecha_montopagado,
      ingresos_disponibles: plan.gym_fecha_ingresosdisponibles,
      metodo_pago: plan.gym_fecha_metodopago,
    },
  };
}
export async function actualizarPlanVigentePorDni({
  documento,
  tipo_plan_id,
  fecha_inicio,
  fecha_fin,
  ingresos_disponibles,
  modificado_por = "SYSTEM",
}) {
  const dni = Number(normalizarDocumento(documento));

  if (!Number.isFinite(dni) || dni <= 0) {
    return {
      ok: false,
      codigo: "VALIDACION",
      mensaje: "Documento inválido",
    };
  }

  if (fecha_fin < fecha_inicio) {
    return {
      ok: false,
      codigo: "VALIDACION",
      mensaje: "fecha_fin no puede ser menor a fecha_inicio",
    };
  }

  return sequelize.transaction(async (t) => {
    const persona = await GymPersona.findOne({
      where: { gym_persona_documento: dni },
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

    const tipoPlan = await GymCatTipoPlan.findByPk(tipo_plan_id, {
      transaction: t,
    });

    if (!tipoPlan) {
      return {
        ok: false,
        codigo: "PLAN_NO_EXISTE",
        mensaje: "El tipo de plan no existe",
      };
    }

    const plan = await GymFechaDisponible.findOne({
      where: { gym_fecha_rela_alumno: alumno.gym_alumno_id },
      order: [
        ["gym_fecha_fin", "DESC"],
        ["gym_fecha_id", "DESC"],
      ],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!plan) {
      return {
        ok: false,
        codigo: "PLAN_NO_EXISTE",
        mensaje: "El alumno no tiene plan registrado",
      };
    }

    const nuevosIngresos =
      ingresos_disponibles == null
        ? plan.gym_fecha_ingresosdisponibles
        : ingresos_disponibles;

    await plan.update(
      {
        gym_fecha_rela_tipoplan: tipo_plan_id,
        gym_fecha_inicio: fecha_inicio,
        gym_fecha_fin: fecha_fin,
        gym_fecha_ingresosdisponibles: nuevosIngresos,
      },
      { transaction: t }
    );

    const hoy = new Date().toLocaleDateString("en-CA");

    const estadoNuevo =
      fecha_fin >= hoy && Number(nuevosIngresos ?? 0) > 0
        ? ESTADO_HABILITADO
        : ESTADO_RESTRINGIDO;

    if (Number(alumno.gym_alumno_rela_estadoalumno) !== estadoNuevo) {
      await alumno.update(
        { gym_alumno_rela_estadoalumno: estadoNuevo },
        { transaction: t }
      );
    }

    await sequelize.query(
      `
      INSERT INTO gym_log_estado_alumno (
        gym_log_estadoalumno_rela_alumno,
        gym_log_estadoalumno_estado_anterior,
        gym_log_estadoalumno_estado_nuevo,
        gym_log_estadoalumno_motivo,
        gym_log_estadoalumno_fuente,
        gym_log_estadoalumno_modificado_por
      )
      VALUES (
        :alumno_id,
        :estado_anterior,
        :estado_nuevo,
        :motivo,
        :fuente,
        :modificado_por
      )
      `,
      {
        replacements: {
          alumno_id: alumno.gym_alumno_id,
          estado_anterior: alumno.gym_alumno_rela_estadoalumno,
          estado_nuevo: estadoNuevo,
          motivo: "Ajuste manual de plan vigente por administrador",
          fuente: "ADMIN_PANEL",
          modificado_por,
        },
        type: QueryTypes.INSERT,
        transaction: t,
      }
    );

    return {
      ok: true,
      mensaje: "Plan vigente actualizado correctamente",
      alumno: {
        alumno_id: alumno.gym_alumno_id,
        nombre: persona.gym_persona_nombre,
        apellido: persona.gym_persona_apellido,
        documento: persona.gym_persona_documento,
        estado_id: estadoNuevo,
      },
      plan: {
        fecha_id: plan.gym_fecha_id,
        tipo_plan_id,
        tipo_plan: tipoPlan.gym_cat_tipoplan_descripcion,
        inicio: fecha_inicio,
        fin: fecha_fin,
        ingresos_disponibles: nuevosIngresos,
      },
    };
  });
}