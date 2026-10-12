import { QueryTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";

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

/**
 * Ingreso por DNI en el kiosco. Antes eran ~10 consultas una detrás de otra (cada una es un viaje
 * a Neon); ahora son 3 dentro de la transacción:
 *   1. persona + alumno, bloqueando al alumno: dos ingresos simultáneos del mismo DNI van de a uno.
 *   2. plan vigente + tipo de plan + "ya entró hoy", leídos DESPUÉS del bloqueo (datos frescos).
 *   3. todo lo que se escribe (ingreso, descuento, estado) en una sola orden.
 */
export async function registrarIngresoPorDni({ dni }) {
  const dniNormalizado = normalizarDocumento(dni);

  const { fecha: hoy, hora, fechaHora } = obtenerFechaHoraSistema();

  if (!dniNormalizado || !/^\d+$/.test(dniNormalizado))
    return { ok: false, codigo: "VALIDACION", mensaje: "Documento inválido" };

  return sequelize.transaction(async (t) => {
    const [quien] = await sequelize.query(
      `
      SELECT p.id AS persona_id, p.nombre, p.apellido, p.documento, a.id AS alumno_id, a.estado_id
      FROM gym_v3.persona p
      LEFT JOIN LATERAL (
        SELECT al.id, al.estado_id FROM gym_v3.alumno al WHERE al.persona_id = p.id LIMIT 1 FOR UPDATE
      ) a ON TRUE
      WHERE p.documento = :dni
      LIMIT 1
      `,
      { replacements: { dni: dniNormalizado }, type: QueryTypes.SELECT, transaction: t }
    );
    if (!quien)
      return { ok: false, codigo: "NO_EXISTE", mensaje: "No existe una persona con ese documento" };
    if (!quien.alumno_id)
      return { ok: false, codigo: "NO_ES_ALUMNO", mensaje: "La persona existe pero no es alumno" };

    const alumnoId = quien.alumno_id;
    const estadoActual = Number(quien.estado_id);

    // fecha_fin >= hoy: el día de vencimiento es inclusive (tiene acceso hasta el final de ese día).
    const [plan] = await sequelize.query(
      `
      SELECT m.id, m.fecha_inicio, m.fecha_fin, m.ingresos_disponibles, m.plan_tipo_id,
             tp.descripcion AS tipo_desc, tp.ingresos AS tipo_ingresos,
             EXISTS (SELECT 1 FROM gym_v3.ingreso i WHERE i.membresia_id = m.id AND i.fecha_ingreso = :hoy) AS ya_hoy
      FROM gym_v3.membresia m
      LEFT JOIN gym_v3.plan_tipo tp ON tp.id = m.plan_tipo_id
      WHERE m.alumno_id = :alumno AND m.fecha_fin >= :hoy
      ORDER BY m.fecha_fin DESC, m.id DESC
      LIMIT 1
      `,
      { replacements: { alumno: alumnoId, hoy }, type: QueryTypes.SELECT, transaction: t }
    );

    const restringir = () =>
      estadoActual === ESTADO_RESTRINGIDO
        ? null
        : sequelize.query(`UPDATE gym_v3.alumno SET estado_id = :e WHERE id = :id`, {
            replacements: { e: ESTADO_RESTRINGIDO, id: alumnoId },
            type: QueryTypes.UPDATE,
            transaction: t,
          });

    if (!plan) {
      await restringir();
      return {
        ok: false,
        codigo: "PLAN_VENCIDO_O_INEXISTENTE",
        mensaje: "El alumno no tiene un plan vigente",
        alumno: { alumno_id: alumnoId, estado_id: ESTADO_RESTRINGIDO },
      };
    }

    // Plan ilimitado: plan_tipo.ingresos = 0 (no se descuenta ni se restringe por ingresos).
    const esIlimitado = plan.plan_tipo_id != null && Number(plan.tipo_ingresos ?? -1) === 0;
    const tipoPlanDesc = plan.plan_tipo_id != null ? (plan.tipo_desc ?? null) : null;
    const ingresosActuales = Number(plan.ingresos_disponibles ?? 0);

    if (!esIlimitado && ingresosActuales <= 0) {
      await restringir();
      return {
        ok: false,
        codigo: "SIN_INGRESOS",
        mensaje: "Alumno sin ingresos disponibles",
        alumno: { alumno_id: alumnoId, estado_id: ESTADO_RESTRINGIDO },
        plan: {
          fecha_id:           plan.id,
          inicio:             plan.fecha_inicio,
          fin:                plan.fecha_fin,
          ingresos_restantes: 0,
        },
      };
    }

    if (plan.ya_hoy) {
      return {
        ok: false,
        codigo: "YA_INGRESO_HOY",
        mensaje: "El alumno ya registró su ingreso hoy",
        alumno: { alumno_id: alumnoId, nombre: quien.nombre, apellido: quien.apellido },
      };
    }

    const ingresosRestantes = esIlimitado ? null : ingresosActuales - 1;
    // Mismas reglas que antes: el ilimitado siempre queda habilitado; con ingresos, un restringido
    // se habilita si le quedan, y el que usa el último queda restringido.
    let estadoFinal = estadoActual;
    if (esIlimitado) estadoFinal = ESTADO_HABILITADO;
    else if (ingresosRestantes === 0) estadoFinal = ESTADO_RESTRINGIDO;
    else if (estadoActual === ESTADO_RESTRINGIDO) estadoFinal = ESTADO_HABILITADO;

    const [ingresoDB] = await sequelize.query(
      `
      WITH nuevo AS (
        INSERT INTO gym_v3.ingreso (membresia_id, fecha_ingreso, hora_ingreso, creado_en)
        VALUES (:plan, :fecha, :hora, :fechaHora)
        RETURNING fecha_ingreso, hora_ingreso
      ),
      descuento AS (
        UPDATE gym_v3.membresia
        SET ingresos_disponibles = :restantes, actualizado_en = :fechaHora
        WHERE id = :plan AND :descontar
      ),
      estado AS (
        UPDATE gym_v3.alumno SET estado_id = :estado WHERE id = :alumno AND :cambiarEstado
      )
      SELECT fecha_ingreso, hora_ingreso FROM nuevo
      `,
      {
        replacements: {
          plan: plan.id,
          fecha: hoy,
          hora,
          fechaHora,
          restantes: ingresosRestantes,
          descontar: !esIlimitado,
          alumno: alumnoId,
          estado: estadoFinal,
          cambiarEstado: estadoFinal !== estadoActual,
        },
        type: QueryTypes.SELECT,
        transaction: t,
      }
    );

    return {
      ok: true,
      codigo: "OK",
      mensaje: esIlimitado || ingresosRestantes > 0
        ? "Ingreso registrado"
        : "Ingreso registrado - alumno quedó restringido",
      alumno: {
        alumno_id:  alumnoId,
        persona_id: quien.persona_id,
        nombre:     quien.nombre,
        apellido:   quien.apellido,
        documento:  quien.documento,
        estado_id:  estadoFinal,
      },
      plan: {
        fecha_id:           plan.id,
        inicio:             plan.fecha_inicio,
        fin:                plan.fecha_fin,
        tipo_plan:          tipoPlanDesc,
        ingresos_restantes: ingresosRestantes,
      },
      fecha_ingreso: ingresoDB?.fecha_ingreso ?? hoy,
      hora_ingreso:  ingresoDB?.hora_ingreso  ?? hora,
    };
  });
}
