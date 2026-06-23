import { QueryTypes } from "sequelize";
import { sequelize } from "../database/sequelize.js";
import {
  Persona,
  Alumno,
  Membresia,
  PlanTipo,
  AlumnoEstado,
} from "../models_v2/index.js";

const ESTADO_HABILITADO  = 1;
const ESTADO_RESTRINGIDO = 2;

function normalizarDocumento(doc) {
  return String(doc ?? "").replace(/[.\s]/g, "").trim();
}

export async function obtenerPlanVigentePorDni({ documento }) {
  const dni = normalizarDocumento(documento);

  if (!dni || !/^\d+$/.test(dni))
    return { ok: false, codigo: "VALIDACION", mensaje: "Documento inválido" };

  const persona = await Persona.findOne({ where: { documento: dni } });
  if (!persona)
    return { ok: false, codigo: "NO_EXISTE", mensaje: "No existe una persona con ese documento" };

  const alumno = await Alumno.findOne({ where: { persona_id: persona.id } });
  if (!alumno)
    return { ok: false, codigo: "NO_ES_ALUMNO", mensaje: "La persona existe pero no es alumno" };

  // Busca el plan más reciente en gym_v3 primero, luego en public como fallback
  let plan = await Membresia.findOne({
    where: { alumno_id: alumno.id },
    order: [["fecha_fin", "DESC"], ["id", "DESC"]],
  });
  if (!plan) {
    const rows = await sequelize.query(
      `SELECT id, alumno_id, plan_tipo_id, fecha_inicio, fecha_fin,
              monto_pagado, ingresos_disponibles, metodo_pago
       FROM public.membresia
       WHERE alumno_id = :alumno_id
       ORDER BY fecha_fin DESC, id DESC
       LIMIT 1`,
      { replacements: { alumno_id: alumno.id }, type: QueryTypes.SELECT }
    );
    plan = rows[0] ?? null;
  }
  if (!plan)
    return { ok: false, codigo: "PLAN_NO_EXISTE", mensaje: "El alumno no tiene plan registrado" };

  const tipoPlan     = plan.plan_tipo_id ? await PlanTipo.findByPk(plan.plan_tipo_id) : null;
  const estadoAlumno = alumno.estado_id  ? await AlumnoEstado.findByPk(alumno.estado_id) : null;

  return {
    ok: true,
    alumno: {
      alumno_id:           alumno.id,
      persona_id:          persona.id,
      nombre:              persona.nombre,
      apellido:            persona.apellido,
      documento:           persona.documento,
      celular:             persona.celular ?? null,
      celular_emergencia:  persona.celular_emergencia ?? null,
      email:               persona.email ?? null,
      fecha_nacimiento:    persona.fecha_nacimiento ?? null,
      estado_id:           alumno.estado_id,
      estado_desc:         estadoAlumno?.descripcion ?? null,
    },
    plan: {
      fecha_id:           plan.id,
      tipo_plan_id:       plan.plan_tipo_id,
      tipo_plan:          tipoPlan?.descripcion ?? null,
      inicio:             plan.fecha_inicio,
      fin:                plan.fecha_fin,
      monto_pagado:       plan.monto_pagado,
      ingresos_disponibles: plan.ingresos_disponibles,
      metodo_pago:        plan.metodo_pago,
    },
  };
}

export async function actualizarPlanVigentePorDni({
  documento,
  tipo_plan_id,
  fecha_inicio,
  fecha_fin,
  ingresos_disponibles,
  modificado_por = null,
}) {
  const dni = normalizarDocumento(documento);

  if (!dni || !/^\d+$/.test(dni))
    return { ok: false, codigo: "VALIDACION", mensaje: "Documento inválido" };
  if (fecha_fin < fecha_inicio)
    return { ok: false, codigo: "VALIDACION", mensaje: "fecha_fin no puede ser menor a fecha_inicio" };

  return sequelize.transaction(async (t) => {
    const persona = await Persona.findOne({ where: { documento: dni }, transaction: t });
    if (!persona)
      return { ok: false, codigo: "NO_EXISTE", mensaje: "No existe una persona con ese documento" };

    const alumno = await Alumno.findOne({
      where: { persona_id: persona.id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!alumno)
      return { ok: false, codigo: "NO_ES_ALUMNO", mensaje: "La persona existe pero no es alumno" };

    const tipoPlan = await PlanTipo.findByPk(tipo_plan_id, { transaction: t });
    if (!tipoPlan)
      return { ok: false, codigo: "PLAN_NO_EXISTE", mensaje: "El tipo de plan no existe" };

    let plan = await Membresia.findOne({
      where: { alumno_id: alumno.id },
      order: [["fecha_fin", "DESC"], ["id", "DESC"]],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    const nuevosIngresos = ingresos_disponibles == null
      ? (plan?.ingresos_disponibles ?? tipoPlan.ingresos_habilitados ?? 0)
      : ingresos_disponibles;

    if (plan) {
      await plan.update(
        { plan_tipo_id: tipo_plan_id, fecha_inicio, fecha_fin, ingresos_disponibles: nuevosIngresos },
        { transaction: t }
      );
    } else {
      plan = await Membresia.create(
        { alumno_id: alumno.id, plan_tipo_id: tipo_plan_id, fecha_inicio, fecha_fin,
          ingresos_disponibles: nuevosIngresos, cobrado_por_id: null },
        { transaction: t }
      );
    }

    const hoy = new Date().toLocaleDateString("en-CA");
    const estadoNuevo = fecha_fin >= hoy && Number(nuevosIngresos ?? 0) > 0
      ? ESTADO_HABILITADO
      : ESTADO_RESTRINGIDO;

    if (Number(alumno.estado_id) !== estadoNuevo) {
      await alumno.update({ estado_id: estadoNuevo }, { transaction: t });
    }

    await sequelize.query(
      `
      INSERT INTO gym_v3.alumno_estado_log (
        alumno_id, estado_anterior_id, estado_nuevo_id,
        motivo, fuente, modificado_por
      )
      VALUES (:alumno_id, :estado_anterior, :estado_nuevo, :motivo, :fuente, :modificado_por)
      `,
      {
        replacements: {
          alumno_id:      alumno.id,
          estado_anterior: alumno.estado_id,
          estado_nuevo:   estadoNuevo,
          motivo:         "Ajuste manual de plan vigente por administrador",
          fuente:         "ADMIN_PANEL",
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
        alumno_id: alumno.id,
        nombre:    persona.nombre,
        apellido:  persona.apellido,
        documento: persona.documento,
        estado_id: estadoNuevo,
      },
      plan: {
        fecha_id:            plan.id,
        tipo_plan_id,
        tipo_plan:           tipoPlan.descripcion,
        inicio:              fecha_inicio,
        fin:                 fecha_fin,
        ingresos_disponibles: nuevosIngresos,
      },
    };
  });
}

export async function actualizarPersonaAlumnoPorDni({
  documento,
  nombre,
  apellido,
  nuevo_documento,
  celular,
  celular_emergencia,
  email,
  fecha_nacimiento,
}) {
  const dni = normalizarDocumento(documento);

  if (!dni || !/^\d+$/.test(dni))
    return { ok: false, codigo: "VALIDACION", mensaje: "Documento inválido" };

  return sequelize.transaction(async (t) => {
    const persona = await Persona.findOne({
      where: { documento: dni },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!persona)
      return { ok: false, codigo: "NO_EXISTE", mensaje: "No existe una persona con ese documento" };

    const nuevoDoc = nuevo_documento != null && String(nuevo_documento).trim() !== ""
      ? String(nuevo_documento).replace(/[.\s]/g, "").trim()
      : null;

    if (nuevoDoc && nuevoDoc !== dni) {
      const existeDoc = await Persona.findOne({ where: { documento: nuevoDoc }, transaction: t });
      if (existeDoc)
        return { ok: false, codigo: "DOCUMENTO_DUPLICADO", mensaje: "Ya existe otra persona con ese DNI" };
    }

    const nuevoEmail = email != null ? email.trim() : null;
    if (nuevoEmail && nuevoEmail !== persona.email) {
      const existeEmail = await Persona.findOne({ where: { email: nuevoEmail }, transaction: t });
      if (existeEmail && existeEmail.id !== persona.id)
        return { ok: false, codigo: "EMAIL_DUPLICADO", mensaje: "Ya existe otra persona con ese email" };
    }

    const updates = { actualizado_en: new Date() };
    if (nombre != null)                   updates.nombre              = nombre.trim();
    if (apellido != null)                 updates.apellido            = apellido.trim();
    if (nuevoDoc)                         updates.documento           = nuevoDoc;
    if (celular !== undefined)            updates.celular             = celular === "" ? null : Number(celular) || null;
    if (celular_emergencia !== undefined) updates.celular_emergencia  = celular_emergencia === "" ? null : Number(celular_emergencia) || null;
    if (email !== undefined)              updates.email               = nuevoEmail === "" ? null : nuevoEmail;
    if (fecha_nacimiento !== undefined)   updates.fecha_nacimiento    = fecha_nacimiento === "" ? null : fecha_nacimiento;

    await persona.update(updates, { transaction: t });

    return {
      ok: true,
      mensaje: "Datos personales actualizados correctamente",
      persona: {
        persona_id:         persona.id,
        nombre:             persona.nombre,
        apellido:           persona.apellido,
        documento:          persona.documento,
        celular:            persona.celular ?? null,
        celular_emergencia: persona.celular_emergencia ?? null,
        email:              persona.email ?? null,
        fecha_nacimiento:   persona.fecha_nacimiento ?? null,
      },
    };
  });
}
