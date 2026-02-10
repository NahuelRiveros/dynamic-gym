import { Op } from "sequelize";
import { sequelize } from "../database/sequelize.js";
import {
  GymPersona,
  GymAlumno,
  GymFechaDisponible,
  GymDiaIngreso,
  GymCatTipoPlan,
} from "../models/index.js";

const ESTADO_HABILITADO = 1;
const ESTADO_RESTRINGIDO = 2;

const normalizarDocumento = (doc) => String(doc).replace(/[.\s]/g, "").trim();
const hoyISO = () => new Date().toISOString().slice(0, 10);

function inicioDelDia(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function inicioManiana(d) {
  const x = inicioDelDia(d);
  x.setDate(x.getDate() + 1);
  return x;
}

export async function registrarIngresoPorDni({ dni }) {
  
  const dniNormalizado = normalizarDocumento(dni);
  const hoy = hoyISO();
  const ahora = new Date();
  console.log("Dni Normalizado:", dniNormalizado)

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

    // 2.1 Restringido
    if (alumno.gym_alumno_rela_estadoalumno === ESTADO_RESTRINGIDO) {
      return {
        ok: false,
        codigo: "RESTRINGIDO",
        mensaje: "Alumno restringido: no tiene ingresos disponibles",
        alumno: { alumno_id: alumno.gym_alumno_id, estado_id: alumno.gym_alumno_rela_estadoalumno },
      };
    }

    // 3) Plan vigente (SIN include, porque rompe con FOR UPDATE)
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

    // // 3.1 Evitar doble ingreso en el día para ese plan
    // const desde = inicioDelDia(ahora);
    // const hasta = inicioManiana(ahora);

    // const yaIngreso = await GymDiaIngreso.findOne({
    //   where: {
    //     gym_dia_rela_fecha: planVigente.gym_fecha_id,
    //     gym_dia_fechaingreso: { [Op.gte]: desde, [Op.lt]: hasta },
    //   },
    //   transaction: t,
    //   lock: t.LOCK.UPDATE,
    // });

    // if (yaIngreso) {
    //   return {
    //     ok: false,
    //     codigo: "YA_INGRESO_HOY",
    //     mensaje: "El alumno ya registró ingreso hoy",
    //     alumno: { alumno_id: alumno.gym_alumno_id },
    //     plan: { fecha_id: planVigente.gym_fecha_id },
    //   };
    // }

    // 4) Validar ingresos (se descuenta siempre)
    const ingresosDisp = planVigente.gym_fecha_ingresosdisponibles;
    const ingresosActuales = Number.isFinite(ingresosDisp) ? ingresosDisp : 0;

    if (ingresosActuales <= 0) {
      // restringimos al alumno y rechazamos
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

    // 5) Insert ingreso
    await GymDiaIngreso.create(
      {
        gym_dia_rela_fecha: planVigente.gym_fecha_id,
        gym_dia_fechaingreso: ahora,
        gym_dia_fechacambio: ahora,
      },
      { transaction: t }
    );

    // 6) Descontar
    const ingresosRestantes = ingresosActuales - 1;

    await planVigente.update(
      {
        gym_fecha_ingresosdisponibles: ingresosRestantes,
        gym_fecha_fechacambio: ahora,
      },
      { transaction: t }
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

    // 8) Traer tipo plan (sin lock)
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
      fecha_ingreso: ahora.toISOString(),
    };
  });
}
