import { sequelize } from "../database/sequelize.js";
import { GymPersona, GymAlumno } from "../models/index.js";

const ESTADO_PENDIENTE = 3;

const normalizarDocumento = (doc) => String(doc).replace(/[.\s]/g, "").trim();

export async function registrarPersonaConAlumno(data) {
  const documento = normalizarDocumento(data.documento);

  return sequelize.transaction(async (t) => {
    const wherePersona = { gym_persona_documento: documento };
    if (data.tipo_documento_id != null) {
      wherePersona.gym_persona_rela_tipodocumento = data.tipo_documento_id;
    }

    const existe = await GymPersona.findOne({ where: wherePersona, transaction: t });
    if (existe) {
      return { ok: false, codigo: "DOCUMENTO_DUPLICADO", mensaje: "Ya existe una persona con ese documento" };
    }

    if (data.email) {
      const existeEmail = await GymPersona.findOne({
        where: { gym_persona_email: data.email.trim() },
        transaction: t
      });
      if (existeEmail) {
        return { ok: false, codigo: "EMAIL_DUPLICADO", mensaje: "Ya existe una persona con ese email" };
      }
    }
    const fechaNac = normalizarFechaNacimiento(data.fecha_nacimiento);
      if (fechaNac === "__INVALID__") {
        return { ok: false, codigo: "VALIDACION", mensaje: "fecha_nacimiento debe ser 'YYYY-MM-DD' o 'DD/MM/YYYY'" };
      }


    const hoy = new Date();

    const persona = await GymPersona.create({
      gym_persona_rela_tipodocumento: data.tipo_documento_id ?? null,
      gym_persona_rela_sexo: data.sexo_id ?? null,
      gym_persona_rela_tipopersona: data.tipo_persona_id ?? null,

      gym_persona_nombre: data.nombre.trim(),
      gym_persona_apellido: data.apellido.trim(),
      gym_persona_fechanacimiento: data.fecha_nacimiento ?? null,
      gym_persona_documento: documento,

      gym_persona_celular: data.celular ?? null,
      gym_persona_celular_emergencia: data.celular_emergencia ?? null,
      gym_persona_email: data.email ?? null,

      gym_persona_fechacambio: hoy
    }, { transaction: t });

    const alumno = await GymAlumno.create({
      gym_alumno_rela_persona: persona.gym_persona_id,
      gym_alumno_rela_tipoplan: null,
      gym_alumno_rela_estadoalumno: ESTADO_PENDIENTE,
      gym_alumno_fecharegistro: hoy,
      gym_alumno_certificadoaptfisica: null,
      gym_alumno_fechacambio: hoy
    }, { transaction: t });

    return {
      ok: true,
      mensaje: "Persona y alumno creados correctamente",
      persona: {
        persona_id: persona.gym_persona_id,
        nombre: persona.gym_persona_nombre,
        apellido: persona.gym_persona_apellido,
        documento: persona.gym_persona_documento,
        tipo_documento_id: persona.gym_persona_rela_tipodocumento,
        sexo_id: persona.gym_persona_rela_sexo,
        tipo_persona_id: persona.gym_persona_rela_tipopersona
      },
      alumno: {
        alumno_id: alumno.gym_alumno_id,
        estado_id: alumno.gym_alumno_rela_estadoalumno
      }
    };
  });
}

export function normalizarFechaNacimiento(fecha) {
  if (!fecha) return null;

  // si ya viene "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return fecha;

  // si viene "DD/MM/YYYY"
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(fecha);
  if (m) {
    const dd = m[1], mm = m[2], yyyy = m[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  return "__INVALID__";
}

