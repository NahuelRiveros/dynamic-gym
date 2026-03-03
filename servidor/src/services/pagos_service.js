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
const TZ_BA = "America/Argentina/Buenos_Aires";

const normalizarDocumento = (doc) =>
  String(doc ?? "").replace(/[.\s]/g, "").trim();

/**
 * YYYY-MM-DD en zona Buenos Aires
 */
function fechaISOArgentina(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ_BA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Suma N días a una fecha ISO (YYYY-MM-DD) y devuelve YYYY-MM-DD
 * (trabajamos sobre UTC para que sea estable y no dependa del server)
 */
function sumarDiasISO(fechaISO, dias) {
  const [y, m, d] = String(fechaISO).split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + Number(dias));
  return dt.toISOString().slice(0, 10);
}

/**
 * Registrar pago por DNI.
 * - Inserta en gym_fecha_disponible (fechacambio lo pone PG en BA)
 * - Actualiza alumno (fechacambio lo pone PG en BA) + lo habilita
 * - Log de cambio de estado si correspondía
 *
 * Lógica:
 * - Si hay plan vigente HOY: el nuevo plan arranca el día siguiente al fin vigente
 * - Si no: arranca HOY
 */
export async function registrarPagoPorDni({
  documento,
  tipo_plan_id,
  monto_pagado,
  metodo_pago,
  modificado_por = "SYSTEM", // ideal: req.user.email
}) {
  const dni = normalizarDocumento(documento);
  const dniNum = Number(dni);


  if (!Number.isFinite(dniNum) || dniNum <= 0) {
    return { ok: false, codigo: "VALIDACION", mensaje: "Documento inválido" };
  }

  const hoyISO = fechaISOArgentina(new Date()); // YYYY-MM-DD en BA

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

    // 2) Alumno (lock)
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

    // 3) Tipo plan
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

    // 4) Plan vigente HOY (lock) - tomar el MÁS NUEVO (inicio DESC)
    const planVigente = await GymFechaDisponible.findOne({
      where: {
        gym_fecha_rela_alumno: alumno.gym_alumno_id,
        gym_fecha_inicio: { [Op.lte]: hoyISO },
        gym_fecha_fin: { [Op.gte]: hoyISO },
      },
      order: [
        ["gym_fecha_inicio", "DESC"], // ✅ clave: más nuevo vigente
        ["gym_fecha_id", "DESC"],
      ],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    // 5) Fechas del nuevo plan
    const inicio = planVigente
      ? sumarDiasISO(String(planVigente.gym_fecha_fin).slice(0, 10), 1)
      : hoyISO;

    // fin inclusivo: inicio + (diasTotales - 1)
    const fin = sumarDiasISO(inicio, diasTotales - 1);

    // 6) INSERT gym_fecha_disponible (timestamps los pone PG en BA)
    const [rowsFD] = await sequelize.query(
      `
      INSERT INTO gym_fecha_disponible (
        gym_fecha_rela_alumno,
        gym_fecha_montopagado,
        gym_fecha_inicio,
        gym_fecha_fin,
        gym_fecha_diasingreso,
        gym_fecha_ingresosdisponibles,
        gym_fecha_metodopago,
        gym_fecha_fechacambio,
        gym_fecha_rela_tipoplan
      )
      VALUES (
        :alumno_id,
        :monto_pagado,
        :inicio::date,
        :fin::date,
        :dias_totales,
        :ingresos_totales,
        :metodo_pago,
        (now() AT TIME ZONE '${TZ_BA}'),
        :tipo_plan_id
      )
      RETURNING gym_fecha_id, gym_fecha_fechacambio
      `,
      {
        type: QueryTypes.INSERT,
        transaction: t,
        replacements: {
          alumno_id: alumno.gym_alumno_id,
          monto_pagado: Number(monto_pagado),
          inicio,
          fin,
          dias_totales: diasTotales,
          ingresos_totales: ingresosTotales,
          metodo_pago: String(metodo_pago ?? ""),
          tipo_plan_id: tipoPlan.gym_cat_tipoplan_id,
        },
      }
    );

    const filaFD = Array.isArray(rowsFD) ? rowsFD[0] : rowsFD;
    const fechaId = filaFD?.gym_fecha_id ?? null;

    // 7) UPDATE alumno: set tipoplan y habilitar
    // 7) UPDATE alumno (con Sequelize, no SQL crudo)
    const estadoAnterior = Number(alumno.gym_alumno_rela_estadoalumno);

    await alumno.update(
      {
        gym_alumno_rela_tipoplan: tipoPlan.gym_cat_tipoplan_id,
        gym_alumno_rela_estadoalumno: ESTADO_HABILITADO,
        // gym_alumno_fechacambio: se actualiza por default en DB o lo podés setear si querés
      },
      { transaction: t }
    );

    // ✅ comprobar de inmediato
    console.log("[PAGO] estadoAnterior:", estadoAnterior);
    console.log("[PAGO] estadoNuevo (obj):", alumno.gym_alumno_rela_estadoalumno);

    // ✅ leer desde DB (para estar 100% seguro)
    const alumnoDB = await GymAlumno.findByPk(alumno.gym_alumno_id, { transaction: t });
    console.log("[PAGO] estadoNuevo (DB):", alumnoDB?.gym_alumno_rela_estadoalumno);

    // 8) Log si cambió el estado
    if (estadoAnterior !== ESTADO_HABILITADO) {
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

    // 9) Respuesta
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
        fecha_id: fechaId,
        monto_pagado: Number(monto_pagado),
        metodo_pago: String(metodo_pago ?? ""),
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
        plan_vigente_fin: planVigente
          ? String(planVigente.gym_fecha_fin).slice(0, 10)
          : null,
      },
    };
  });
}

/**
 * Preview pago por DNI:
 * Devuelve alumno + plan vigente (si existe) para confirmar antes de pagar.
 *
 * Acá usamos CURRENT_DATE del servidor PG.
 * Si querés que sea 100% BA aunque el server no esté en BA:
 * reemplazamos CURRENT_DATE por: (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date
 */
export async function previewPagoPorDni({ documento }) {
  const dni = normalizarDocumento(documento);
  const dniNum = Number(dni);

  if (!Number.isFinite(dniNum) || dniNum <= 0) {
    return { ok: false, codigo: "VALIDACION", mensaje: "Documento inválido" };
  }

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

      -- 👇 último pago (más reciente)
      flast.gym_fecha_id AS pago_id,
      flast.gym_fecha_inicio AS pago_inicio,
      flast.gym_fecha_fin AS pago_fin,
      flast.gym_fecha_ingresosdisponibles AS ingresos_disponibles,
      flast.gym_fecha_montopagado AS monto_pagado,
      flast.gym_fecha_metodopago AS metodo_pago,
      flast.gym_fecha_fechacambio AS fecha_pago,
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
        f.gym_fecha_rela_tipoplan,
        f.gym_fecha_montopagado,
        f.gym_fecha_metodopago,
        f.gym_fecha_fechacambio
      FROM gym_fecha_disponible f
      WHERE f.gym_fecha_rela_alumno = a.gym_alumno_id
      ORDER BY f.gym_fecha_id DESC  -- ✅ último pago real
      LIMIT 1
    ) flast ON TRUE

    LEFT JOIN gym_cat_tipoplan tp
      ON tp.gym_cat_tipoplan_id = flast.gym_fecha_rela_tipoplan

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
    ultimo_pago: it.pago_id
      ? {
          pago_id: it.pago_id,
          inicio: it.pago_inicio ? String(it.pago_inicio).slice(0, 10) : null,
          fin: it.pago_fin ? String(it.pago_fin).slice(0, 10) : null,
          ingresos_disponibles: it.ingresos_disponibles,
          tipo_desc: it.plan_tipo_desc,
          monto_pagado: it.monto_pagado,
          metodo_pago: it.metodo_pago,
          fecha_pago: it.fecha_pago, // timestamp
        }
      : null,
  };
}