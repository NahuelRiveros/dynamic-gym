// src/services/pagos_service.js
import { sequelize } from "../database/sequelize.js";
import {
  GymPersona,
  GymAlumno,
  GymFechaDisponible,
  GymCatTipoPlan,
} from "../models/index.js";

const ESTADO_HABILITADO = 1;

const normalizarDocumento = (doc) => String(doc).replace(/[.\s]/g, "").trim();

function sumarDiasISO(fechaISO, dias) {
  // fechaISO: 'YYYY-MM-DD'
  const [y, m, d] = fechaISO.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + Number(dias));
  return dt.toISOString().slice(0, 10);
}

export async function registrarPagoPorDni({
  documento,
  tipo_plan_id,
  monto_pagado,
  metodo_pago,
}) {
  const dni = normalizarDocumento(documento);
  const hoyISO = new Date().toISOString().slice(0, 10);
  const ahora = new Date();

  return sequelize.transaction(async (t) => {
    // 1) Persona por DNI
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

    // 2) Alumno (lock fila para consistencia)
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

    // 3) Tipo de plan (días + ingresos salen del catálogo)
    const tipoPlan = await GymCatTipoPlan.findByPk(tipo_plan_id, {
      transaction: t,
    });

    if (!tipoPlan) {
      return {
        ok: false,
        codigo: "PLAN_NO_EXISTE",
        mensaje: "No existe el tipo de plan indicado",
      };
    }

    const diasTotales = Number(tipoPlan.gym_cat_tipoplan_dias_totales);
    const ingresosTotales = Number(tipoPlan.gym_cat_tipoplan_ingresos);
    console.log({diasTotales,ingresosTotales})
    if (!Number.isFinite(diasTotales) || diasTotales <= 0) {
      return {
        ok: false,
        codigo: "VALIDACION",
        mensaje: "El plan tiene días inválidos (dias_totales)",
      };
    }

    if (!Number.isFinite(ingresosTotales) || ingresosTotales < 0) {
      return {
        ok: false,
        codigo: "VALIDACION",
        mensaje: "El plan tiene ingresos inválidos (ingresos)",
      };
    }

    // 4) Fechas del plan (backend calcula)
    const inicio = hoyISO;
    const fin = sumarDiasISO(hoyISO, diasTotales);

    // 5) Insert en gym_fecha_disponible
    const fechaDisponible = await GymFechaDisponible.create(
      {
        gym_fecha_rela_alumno: alumno.gym_alumno_id,
        gym_fecha_montopagado: Number(monto_pagado),
        gym_fecha_inicio: inicio,
        gym_fecha_fin: fin,
        gym_fecha_diasingreso: diasTotales,
        gym_fecha_ingresosdisponibles: ingresosTotales,
        gym_fecha_metodopago: String(metodo_pago),
        gym_fecha_fechacambio: ahora,
        gym_fecha_rela_tipoplan: tipoPlan.gym_cat_tipoplan_id,
      },
      { transaction: t }
    );

    // 6) Actualizar alumno: plan + habilitar
    await alumno.update(
      {
        gym_alumno_rela_tipoplan: tipoPlan.gym_cat_tipoplan_id,
        gym_alumno_rela_estadoalumno: ESTADO_HABILITADO,
        gym_alumno_fechacambio: ahora,
      },
      { transaction: t }
    );

    return {
      ok: true,
      codigo: "OK",
      mensaje: "Pago registrado y alumno habilitado",
      alumno: {
        alumno_id: alumno.gym_alumno_id,
        persona_id: persona.gym_persona_id,
        nombre: persona.gym_persona_nombre,
        apellido: persona.gym_persona_apellido,
        documento: persona.gym_persona_documento,
        estado_id: ESTADO_HABILITADO,
        tipo_plan_id: tipoPlan.gym_cat_tipoplan_id,
      },
      pago: {
        fecha_id: fechaDisponible.gym_fecha_id,
        monto_pagado: Number(monto_pagado),
        metodo_pago: String(metodo_pago),
      },
      plan: {
        tipo_plan_id: tipoPlan.gym_cat_tipoplan_id,
        tipo_plan_descripcion: tipoPlan.gym_cat_tipoplan_descripcion,
        inicio,
        fin,
        dias_totales: diasTotales,
        ingresos_disponibles: ingresosTotales,
      },
    };
  });
}
