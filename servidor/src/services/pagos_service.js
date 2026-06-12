import { sequelize } from "../database/sequelize.js";
import { QueryTypes } from "sequelize";
import {
  Persona,
  Alumno,
  Membresia,
  PlanTipo,
} from "../models_v2/index.js";

const ESTADO_HABILITADO = 1;
const TZ_BA = "America/Argentina/Buenos_Aires";

const normalizarDocumento = (doc) =>
  String(doc ?? "").replace(/[.\s]/g, "").trim();

function fechaISOArgentina(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ_BA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function sumarDiasISO(fechaISO, dias) {
  const [y, m, d] = String(fechaISO).split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + Number(dias));
  return dt.toISOString().slice(0, 10);
}

export async function registrarPagoPorDni({
  documento,
  tipo_plan_id,
  monto_pagado,
  metodo_pago,
  usuario_id_cobro,
  modificado_por = "SYSTEM",
}) {
  const dni = normalizarDocumento(documento);

  if (!dni || !/^\d+$/.test(dni))
    return { ok: false, codigo: "VALIDACION", mensaje: "Documento inválido" };
  if (!Number.isFinite(Number(tipo_plan_id)) || Number(tipo_plan_id) <= 0)
    return { ok: false, codigo: "VALIDACION", mensaje: "tipo_plan_id inválido" };
  if (!Number.isFinite(Number(monto_pagado)) || Number(monto_pagado) <= 0)
    return { ok: false, codigo: "VALIDACION", mensaje: "monto_pagado inválido" };
  if (!String(metodo_pago ?? "").trim())
    return { ok: false, codigo: "VALIDACION", mensaje: "metodo_pago es obligatorio" };
  if (!Number.isFinite(Number(usuario_id_cobro)) || Number(usuario_id_cobro) <= 0)
    return { ok: false, codigo: "USUARIO_COBRO_INVALIDO", mensaje: "No se pudo identificar el usuario que registra el pago" };

  const hoyISO = fechaISOArgentina(new Date());

  return sequelize.transaction(async (t) => {
    const persona = await Persona.findOne({
      where: { documento: dni },
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

    const tipoPlan = await PlanTipo.findByPk(Number(tipo_plan_id), { transaction: t });
    if (!tipoPlan)
      return { ok: false, codigo: "PLAN_NO_EXISTE", mensaje: "No existe el tipo de plan indicado" };

    const diasTotales = Number(tipoPlan.dias_totales);
    const ingresosTotales = Number(tipoPlan.ingresos);

    if (!Number.isFinite(diasTotales) || diasTotales <= 0)
      return { ok: false, codigo: "VALIDACION", mensaje: "El plan tiene días inválidos (dias_totales)" };
    if (!Number.isFinite(ingresosTotales) || ingresosTotales < 0)
      return { ok: false, codigo: "VALIDACION", mensaje: "El plan tiene ingresos inválidos (ingresos)" };

    const inicio = hoyISO;
    const fin = sumarDiasISO(inicio, diasTotales - 1);

    const [rowsFD] = await sequelize.query(
      `
      INSERT INTO membresia (
        alumno_id, monto_pagado, fecha_inicio, fecha_fin,
        dias_totales, ingresos_disponibles, metodo_pago,
        actualizado_en, plan_tipo_id, cobrado_por_id
      )
      VALUES (
        :alumno_id, :monto_pagado, :inicio::date, :fin::date,
        :dias_totales, :ingresos_totales, :metodo_pago,
        (now() AT TIME ZONE '${TZ_BA}'), :tipo_plan_id, :usuario_id_cobro
      )
      RETURNING id, actualizado_en, cobrado_por_id
      `,
      {
        type: QueryTypes.INSERT,
        transaction: t,
        replacements: {
          alumno_id:      alumno.id,
          monto_pagado:   Number(monto_pagado),
          inicio,
          fin,
          dias_totales:   diasTotales,
          ingresos_totales: ingresosTotales,
          metodo_pago:    String(metodo_pago ?? "").trim(),
          tipo_plan_id:   tipoPlan.id,
          usuario_id_cobro: Number(usuario_id_cobro),
        },
      }
    );

    const filaFD = Array.isArray(rowsFD) ? rowsFD[0] : rowsFD;
    const fechaId       = filaFD?.id ?? null;
    const fechaCambio   = filaFD?.actualizado_en ?? null;
    const usuarioCobroId = filaFD?.cobrado_por_id ?? Number(usuario_id_cobro);

    const estadoAnterior = Number(alumno.estado_id);

    await alumno.update(
      { plan_tipo_id: tipoPlan.id, estado_id: ESTADO_HABILITADO },
      { transaction: t }
    );

    if (estadoAnterior !== ESTADO_HABILITADO) {
      await sequelize.query(
        `
        INSERT INTO alumno_estado_log (
          alumno_id, estado_anterior_id, estado_nuevo_id,
          creado_en, motivo, fuente, modificado_por
        )
        VALUES (
          :alumno_id, :anterior, :nuevo,
          (now() AT TIME ZONE '${TZ_BA}'), :motivo, :fuente, :modificado_por
        )
        `,
        {
          type: QueryTypes.INSERT,
          transaction: t,
          replacements: {
            alumno_id: alumno.id,
            anterior:  estadoAnterior,
            nuevo:     ESTADO_HABILITADO,
            motivo:    "Habilitado por registro de pago",
            fuente:    "PAGOS",
            modificado_por,
          },
        }
      );
    }

    return {
      ok: true,
      codigo: "OK",
      mensaje: "Pago registrado y alumno habilitado",
      alumno: {
        alumno_id:  alumno.id,
        persona_id: persona.id,
        nombre:     persona.nombre,
        apellido:   persona.apellido,
        documento:  persona.documento,
        estado_id:  ESTADO_HABILITADO,
        tipo_plan_id: tipoPlan.id,
      },
      pago: {
        fecha_id:        fechaId,
        monto_pagado:    Number(monto_pagado),
        metodo_pago:     String(metodo_pago ?? "").trim(),
        usuario_id_cobro: usuarioCobroId,
        fecha_cambio:    fechaCambio,
      },
      plan: {
        tipo_plan_id:          tipoPlan.id,
        tipo_plan_descripcion: tipoPlan.descripcion,
        inicio,
        fin,
        dias_totales:          diasTotales,
        ingresos_disponibles:  ingresosTotales,
      },
      info: { inicia_desde_hoy: true },
    };
  });
}

export async function previewPagoPorDni({ documento }) {
  const dni = normalizarDocumento(documento);

  if (!dni || !/^\d+$/.test(dni))
    return { ok: false, codigo: "VALIDACION", mensaje: "Documento inválido" };

  const sql = `
    SELECT
      a.id AS gym_alumno_id,
      a.estado_id,
      ea.descripcion AS estado_desc,

      p.id AS gym_persona_id,
      p.nombre AS gym_persona_nombre,
      p.apellido AS gym_persona_apellido,
      p.documento AS gym_persona_documento,
      p.email AS gym_persona_email,
      p.celular AS gym_persona_celular,

      flast.id          AS pago_id,
      flast.fecha_inicio AS pago_inicio,
      flast.fecha_fin    AS pago_fin,
      flast.ingresos_disponibles,
      flast.monto_pagado,
      flast.metodo_pago,
      flast.actualizado_en AS fecha_pago,
      tp.descripcion AS plan_tipo_desc
    FROM persona p
    LEFT JOIN alumno a ON a.persona_id = p.id
    LEFT JOIN alumno_estado ea ON ea.id = a.estado_id
    LEFT JOIN LATERAL (
      SELECT f.id, f.fecha_inicio, f.fecha_fin, f.ingresos_disponibles,
             f.plan_tipo_id, f.monto_pagado, f.metodo_pago, f.actualizado_en
      FROM membresia f
      WHERE f.alumno_id = a.id
      ORDER BY f.id DESC
      LIMIT 1
    ) flast ON TRUE
    LEFT JOIN plan_tipo tp ON tp.id = flast.plan_tipo_id
    WHERE p.documento = :dniNum
    LIMIT 1
  `;

  const rows = await sequelize.query(sql, {
    type: QueryTypes.SELECT,
    replacements: { dniNum: dni },
  });

  const it = rows?.[0];

  if (!it)
    return { ok: false, codigo: "NO_EXISTE", mensaje: "No existe una persona con ese documento" };
  if (!it.gym_alumno_id)
    return { ok: false, codigo: "NO_ES_ALUMNO", mensaje: "La persona existe pero no es alumno" };

  return {
    ok: true,
    alumno: {
      alumno_id:  it.gym_alumno_id,
      persona_id: it.gym_persona_id,
      nombre:     it.gym_persona_nombre,
      apellido:   it.gym_persona_apellido,
      documento:  it.gym_persona_documento,
      email:      it.gym_persona_email,
      celular:    it.gym_persona_celular,
      estado_id:  it.estado_id,
      estado_desc: it.estado_desc,
    },
    ultimo_pago: it.pago_id
      ? {
          pago_id:             it.pago_id,
          inicio:              it.pago_inicio ? String(it.pago_inicio).slice(0, 10) : null,
          fin:                 it.pago_fin    ? String(it.pago_fin).slice(0, 10)    : null,
          ingresos_disponibles: it.ingresos_disponibles,
          tipo_desc:           it.plan_tipo_desc,
          monto_pagado:        it.monto_pagado,
          metodo_pago:         it.metodo_pago,
          fecha_pago:          it.fecha_pago,
        }
      : null,
  };
}
