// src/services/pagos_service.js
import { sequelize } from "../database/sequelize.js";
import { QueryTypes, Op } from "sequelize";
import {
  GymPersona,
  GymAlumno,
  GymFechaDisponible,
  GymCatTipoPlan,
} from "../models/index.js";

const ESTADO_HABILITADO = 1;

const normalizarDocumento = (doc) => String(doc ?? "").replace(/[.\s]/g, "").trim();

/**
 * Suma N días a una fecha ISO (YYYY-MM-DD) en UTC y devuelve YYYY-MM-DD
 */
function sumarDiasISO(fechaISO, dias) {
  const [y, m, d] = String(fechaISO).split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + Number(dias));
  return dt.toISOString().slice(0, 10);
}

/**
 * Registrar pago por DNI.
 * - Crea un registro en gym_fecha_disponible
 * - Actualiza alumno (plan + estado habilitado)
 * - Inserta log de cambio de estado si correspondía
 *
 * DECISIÓN: permite pagar aunque tenga plan vigente (apila)
 * - Si hay plan vigente HOY, el nuevo plan empieza al día siguiente del fin vigente.
 * - Si no hay plan vigente, empieza HOY.
 */
export async function registrarPagoPorDni({
  documento,
  tipo_plan_id,
  monto_pagado,
  metodo_pago,
  modificado_por = "SYSTEM", // opcional: pasá req.user.email desde controller
}) {
  const dni = normalizarDocumento(documento);
  const dniNum = Number(dni);

  if (!Number.isFinite(dniNum) || dniNum <= 0) {
    return { ok: false, codigo: "VALIDACION", mensaje: "Documento inválido" };
  }

  const hoy = new Date();
  const hoyISO = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()))
    .toISOString()
    .slice(0, 10);
  const ahora = new Date();

  return sequelize.transaction(async (t) => {
    // 1) Persona por DNI
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

    // 2) Alumno (lock para consistencia)
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

    // 3) Tipo de plan
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

    // 4) Detectar si ya tiene un plan vigente HOY
    const planVigente = await GymFechaDisponible.findOne({
      where: {
        gym_fecha_rela_alumno: alumno.gym_alumno_id,
        gym_fecha_inicio: { [Op.lte]: hoyISO },
        gym_fecha_fin: { [Op.gte]: hoyISO },
      },
      order: [
        ["gym_fecha_fin", "DESC"],
        ["gym_fecha_id", "DESC"],
      ],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    // 5) Fechas del nuevo plan (apilado si hay vigente)
    const inicio = planVigente
      ? sumarDiasISO(String(planVigente.gym_fecha_fin).slice(0, 10), 1) // día siguiente al fin vigente
      : hoyISO;

    // fin inclusivo: inicio + (diasTotales - 1)
    const fin = sumarDiasISO(inicio, diasTotales - 1);

    // 6) Insert en gym_fecha_disponible
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

    // 7) Actualizar alumno: plan + habilitar
    const estadoAnterior = Number(alumno.gym_alumno_rela_estadoalumno);

    await alumno.update(
      {
        gym_alumno_rela_tipoplan: tipoPlan.gym_cat_tipoplan_id,
        gym_alumno_rela_estadoalumno: ESTADO_HABILITADO,
        gym_alumno_fechacambio: ahora,
      },
      { transaction: t }
    );

    // 8) Insert log si cambió el estado
    if (estadoAnterior !== ESTADO_HABILITADO) {
      await sequelize.query(
        `
        INSERT INTO gym_log_estado_alumno (
          gym_log_estadoalumno_rela_alumno,
          gym_log_estadoalumno_estado_anterior,
          gym_log_estadoalumno_estado_nuevo,
          gym_log_estadoalumno_motivo,
          gym_log_estadoalumno_fuente,
          gym_log_estadoalumno_modificado_por
        ) VALUES (
          :alumno_id,
          :anterior,
          :nuevo,
          :motivo,
          :fuente,
          :modificado_por
        );
        `,
        {
          type: QueryTypes.INSERT,
          transaction: t,
          replacements: {
            alumno_id: alumno.gym_alumno_id,
            anterior: estadoAnterior,
            nuevo: ESTADO_HABILITADO,
            motivo: "Habilitado por registro de pago",
            fuente: "PAGOS",
            modificado_por,
          },
        }
      );
    }

    return {
      ok: true,
      codigo: "OK",
      mensaje: planVigente
        ? "Pago registrado. El plan se programó al finalizar el vigente."
        : "Pago registrado y alumno habilitado",
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
      info: {
        tenia_plan_vigente: Boolean(planVigente),
        plan_vigente_fin: planVigente ? String(planVigente.gym_fecha_fin).slice(0, 10) : null,
      },
    };
  });
}

export async function previewPagoPorDni({ documento }) {
  const dni = normalizarDocumento(documento);
  const dniNum = Number(dni);

  if (!Number.isFinite(dniNum) || dniNum <= 0) {
    return { ok: false, codigo: "VALIDACION", mensaje: "Documento inválido" };
  }

  // Buscamos alumno + plan vigente (si hay)
  const sql = `
    SELECT
      a.gym_alumno_id,
      a.gym_alumno_rela_estadoalumno AS estado_id,
      ea.gym_cat_estadoalumno_descripcion AS estado_desc,

      p.gym_persona_id,
      p.gym_persona_nombre,
      p.gym_persona_apellido,
      p.gym_persona_documento,
      p.gym_persona_email,
      p.gym_persona_celular,

      fvig.gym_fecha_id AS plan_id,
      fvig.gym_fecha_inicio AS plan_inicio,
      fvig.gym_fecha_fin AS plan_fin,
      fvig.gym_fecha_ingresosdisponibles AS ingresos_disponibles,
      tp.gym_cat_tipoplan_descripcion AS plan_tipo_desc
    FROM gym_persona p
    LEFT JOIN gym_alumno a
      ON a.gym_alumno_rela_persona = p.gym_persona_id
    LEFT JOIN gym_cat_estado_alumno ea
      ON ea.gym_cat_estadoalumno_id = a.gym_alumno_rela_estadoalumno

    LEFT JOIN LATERAL (
      SELECT
        f.gym_fecha_id,
        f.gym_fecha_inicio,
        f.gym_fecha_fin,
        f.gym_fecha_ingresosdisponibles,
        f.gym_fecha_rela_tipoplan
      FROM gym_fecha_disponible f
      WHERE f.gym_fecha_rela_alumno = a.gym_alumno_id
        AND f.gym_fecha_inicio <= CURRENT_DATE
        AND f.gym_fecha_fin >= CURRENT_DATE
      ORDER BY f.gym_fecha_fin DESC, f.gym_fecha_id DESC
      LIMIT 1
    ) fvig ON TRUE

    LEFT JOIN gym_cat_tipoplan tp
      ON tp.gym_cat_tipoplan_id = fvig.gym_fecha_rela_tipoplan

    WHERE p.gym_persona_documento = :dniNum
    LIMIT 1;
  `;

  const rows = await sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: { dniNum },
  });

  const it = rows?.[0];
  if (!it) {
    return { ok: false, codigo: "NO_EXISTE", mensaje: "No existe una persona con ese documento" };
  }
  if (!it.gym_alumno_id) {
    return { ok: false, codigo: "NO_ES_ALUMNO", mensaje: "La persona existe pero no es alumno" };
  }

  return {
    ok: true,
    alumno: {
      alumno_id: it.gym_alumno_id,
      persona_id: it.gym_persona_id,
      nombre: it.gym_persona_nombre,
      apellido: it.gym_persona_apellido,
      documento: it.gym_persona_documento,
      email: it.gym_persona_email,
      celular: it.gym_persona_celular,
      estado_id: it.estado_id,
      estado_desc: it.estado_desc,
    },
    plan_vigente: it.plan_id
      ? {
          plan_id: it.plan_id,
          inicio: String(it.plan_inicio).slice(0, 10),
          fin: String(it.plan_fin).slice(0, 10),
          ingresos_disponibles: it.ingresos_disponibles,
          tipo_desc: it.plan_tipo_desc,
        }
      : null,
  };
}