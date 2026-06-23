import { QueryTypes, Op } from "sequelize";
import { sequelize } from "../database/sequelize.js";
import {
  Persona,
  Alumno,
  Membresia,
  PlanTipo,
} from "../models_v2/index.js";

// import { agregarALaCola } from "./offline_queue_service.js";

const ESTADO_HABILITADO  = 1;
const ESTADO_RESTRINGIDO = 2;

const normalizarDocumento = (doc) =>
  String(doc ?? "").replace(/[.\s]/g, "").trim();

function obtenerFechaHoraSistema() {
  const ahora = new Date();
  const tz = "America/Argentina/Buenos_Aires";

  const fecha = ahora.toLocaleDateString("en-CA", { timeZone: tz });
  const hora = ahora.toLocaleTimeString("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return { fecha, hora, fechaHora: `${fecha} ${hora}` };
}

export async function registrarIngresoPorDni({ dni }) {
  const dniNormalizado = normalizarDocumento(dni);

  const { fecha: hoy, hora, fechaHora } = obtenerFechaHoraSistema();

  if (!dniNormalizado || !/^\d+$/.test(dniNormalizado))
    return { ok: false, codigo: "VALIDACION", mensaje: "Documento inválido" };

  return sequelize.transaction(async (t) => {
    const persona = await Persona.findOne({
      where: { documento: dniNormalizado },
      transaction: t,
    });
    if (!persona)
      return { ok: false, codigo: "NO_EXISTE", mensaje: "No existe una persona con ese documento" };

    const alumno = await Alumno.findOne({
      where: { persona_id: persona.id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!alumno)
      return { ok: false, codigo: "NO_ES_ALUMNO", mensaje: "La persona existe pero no es alumno" };

    const planReciente = await Membresia.findOne({
      where: {
        alumno_id: alumno.id,
        // fecha_fin >= hoy: el día de vencimiento es inclusive, el alumno
        // mantiene acceso hasta el final de ese día (no hasta el día anterior).
        fecha_fin: { [Op.gte]: hoy },
      },
      order: [
        ["fecha_fin", "DESC"],
        ["id", "DESC"],
      ],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!planReciente) {
      if (Number(alumno.estado_id) !== ESTADO_RESTRINGIDO) {
        await alumno.update({ estado_id: ESTADO_RESTRINGIDO }, { transaction: t });
      }
      return {
        ok: false,
        codigo: "PLAN_VENCIDO_O_INEXISTENTE",
        mensaje: "El alumno no tiene un plan vigente",
        alumno: { alumno_id: alumno.id, estado_id: ESTADO_RESTRINGIDO },
      };
    }

    const ingresosActuales = Number(planReciente.ingresos_disponibles ?? 0);

    if (ingresosActuales <= 0) {
      if (Number(alumno.estado_id) !== ESTADO_RESTRINGIDO) {
        await alumno.update({ estado_id: ESTADO_RESTRINGIDO }, { transaction: t });
      }
      return {
        ok: false,
        codigo: "SIN_INGRESOS",
        mensaje: "Alumno sin ingresos disponibles",
        alumno: { alumno_id: alumno.id, estado_id: ESTADO_RESTRINGIDO },
        plan: {
          fecha_id:         planReciente.id,
          inicio:           planReciente.fecha_inicio,
          fin:              planReciente.fecha_fin,
          ingresos_restantes: 0,
        },
      };
    }

    // Evitar doble check-in el mismo día
    const [yaHoy] = await sequelize.query(
      `SELECT id FROM ingreso WHERE membresia_id = :membresia_id AND fecha_ingreso = :fecha LIMIT 1`,
      {
        replacements: { membresia_id: planReciente.id, fecha: hoy },
        type: QueryTypes.SELECT,
        transaction: t,
      }
    );
    if (yaHoy) {
      return {
        ok: false,
        codigo: "YA_INGRESO_HOY",
        mensaje: "El alumno ya registró su ingreso hoy",
        alumno: { alumno_id: alumno.id, nombre: persona.nombre, apellido: persona.apellido },
      };
    }

    const [rows] = await sequelize.query(
      `
      INSERT INTO ingreso (membresia_id, fecha_ingreso, hora_ingreso, creado_en)
      VALUES (:fecha_id, :fecha, :hora, :fechaHora)
      RETURNING id, fecha_ingreso, hora_ingreso
      `,
      {
        replacements: {
          fecha_id: planReciente.id,
          fecha: hoy,
          hora,
          fechaHora,
        },
        type: QueryTypes.INSERT,
        transaction: t,
      }
    );

    const ingresoDB = Array.isArray(rows) ? rows[0] : rows;
    const ingresosRestantes = ingresosActuales - 1;

    await sequelize.query(
      `
      UPDATE membresia
      SET ingresos_disponibles = :restantes, actualizado_en = :fechaHora
      WHERE id = :fecha_id
      `,
      {
        replacements: { restantes: ingresosRestantes, fechaHora, fecha_id: planReciente.id },
        type: QueryTypes.UPDATE,
        transaction: t,
      }
    );

    let estadoFinal = Number(alumno.estado_id);

    if (estadoFinal === ESTADO_RESTRINGIDO && ingresosRestantes > 0) {
      await alumno.update({ estado_id: ESTADO_HABILITADO }, { transaction: t });
      estadoFinal = ESTADO_HABILITADO;
    }

    if (ingresosRestantes === 0) {
      await alumno.update({ estado_id: ESTADO_RESTRINGIDO }, { transaction: t });
      estadoFinal = ESTADO_RESTRINGIDO;
    }

    let tipoPlanDesc = null;
    if (planReciente.plan_tipo_id) {
      const tipoPlan = await PlanTipo.findByPk(planReciente.plan_tipo_id, { transaction: t });
      tipoPlanDesc = tipoPlan?.descripcion ?? null;
    }

    return {
      ok: true,
      codigo: "OK",
      mensaje: ingresosRestantes === 0
        ? "Ingreso registrado - alumno quedó restringido"
        : "Ingreso registrado",
      alumno: {
        alumno_id:  alumno.id,
        persona_id: persona.id,
        nombre:     persona.nombre,
        apellido:   persona.apellido,
        documento:  persona.documento,
        estado_id:  estadoFinal,
      },
      plan: {
        fecha_id:          planReciente.id,
        inicio:            planReciente.fecha_inicio,
        fin:               planReciente.fecha_fin,
        tipo_plan:         tipoPlanDesc,
        ingresos_restantes: ingresosRestantes,
      },
      fecha_ingreso: ingresoDB?.fecha_ingreso ?? hoy,
      hora_ingreso:  ingresoDB?.hora_ingreso  ?? hora,
    };
  });
}
