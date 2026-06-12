import { sequelize } from "../database/sequelize.js";
import { Persona, Alumno } from "../models_v2/index.js";

const ESTADO_PENDIENTE = 3;

const normalizarDocumento = (doc) => String(doc).replace(/[.\s]/g, "").trim();

export async function registrarPersonaConAlumno(data) {
  const documento = normalizarDocumento(data.documento);

  return sequelize.transaction(async (t) => {
    const wherePersona = { documento };
    if (data.tipo_documento_id != null) {
      wherePersona.tipo_documento_id = data.tipo_documento_id;
    }

    const existe = await Persona.findOne({ where: wherePersona, transaction: t });
    if (existe)
      return { ok: false, codigo: "DOCUMENTO_DUPLICADO", mensaje: "Ya existe una persona con ese documento" };

    if (data.email) {
      const existeEmail = await Persona.findOne({
        where: { email: data.email.trim() },
        transaction: t,
      });
      if (existeEmail)
        return { ok: false, codigo: "EMAIL_DUPLICADO", mensaje: "Ya existe una persona con ese email" };
    }

    const fechaNac = normalizarFechaNacimiento(data.fecha_nacimiento);
    if (fechaNac === "__INVALID__")
      return { ok: false, codigo: "VALIDACION", mensaje: "fecha_nacimiento debe ser 'YYYY-MM-DD' o 'DD/MM/YYYY'" };

    const hoy = new Date();

    const persona = await Persona.create({
      tipo_documento_id: data.tipo_documento_id ?? null,
      sexo_id:           data.sexo_id ?? null,
      tipo_persona_id:   data.tipo_persona_id ?? null,
      nombre:            data.nombre.trim(),
      apellido:          data.apellido.trim(),
      fecha_nacimiento:  fechaNac ?? null,
      documento,
      celular:           data.celular ?? null,
      celular_emergencia: data.celular_emergencia ?? null,
      email:             data.email ?? null,
      actualizado_en:    hoy,
    }, { transaction: t });

    const alumno = await Alumno.create({
      persona_id:            persona.id,
      plan_tipo_id:          null,
      estado_id:             ESTADO_PENDIENTE,
      fecha_registro:        hoy,
      certificado_apt_fisica: null,
      actualizado_en:        hoy,
    }, { transaction: t });

    return {
      ok: true,
      mensaje: "Persona y alumno creados correctamente",
      persona: {
        persona_id:        persona.id,
        nombre:            persona.nombre,
        apellido:          persona.apellido,
        documento:         persona.documento,
        tipo_documento_id: persona.tipo_documento_id,
        sexo_id:           persona.sexo_id,
        tipo_persona_id:   persona.tipo_persona_id,
      },
      alumno: {
        alumno_id: alumno.id,
        estado_id: alumno.estado_id,
      },
    };
  });
}

export function normalizarFechaNacimiento(fecha) {
  if (!fecha) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return fecha;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(fecha);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return "__INVALID__";
}
