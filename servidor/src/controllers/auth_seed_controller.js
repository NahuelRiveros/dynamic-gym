import bcrypt from "bcrypt";
import { sequelize } from "../database/sequelize.js";
import { GymPersona, GymUsuario, GymUsuarioRol, GymRol } from "../models/index.js";

const normalizarEmail = (v) => String(v ?? "").trim().toLowerCase();
const normalizarDocumento = (v) => String(v ?? "").replace(/[.\s]/g, "").trim();

async function crearUsuarioConRol({ email, password, nombre, apellido, documento, rolCodigo }) {
  const emailN = normalizarEmail(email);
  const pass = String(password ?? "").trim();
  const doc = normalizarDocumento(documento);

  if (!emailN || !pass || !nombre || !apellido || !doc || !rolCodigo) {
    return {
      ok: false,
      codigo: "FALTAN_DATOS",
      mensaje: "Requiere: email, password, nombre, apellido, documento, rolCodigo",
    };
  }

  const result = await sequelize.transaction(async (t) => {
    // 1) Buscar rol
    const rol = await GymRol.findOne({
      where: { gym_rol_codigo: rolCodigo },
      transaction: t,
    });

    if (!rol) {
      return {
        ok: false,
        codigo: "SIN_ROL",
        mensaje: `No existe rol '${rolCodigo}' en gym_rol`,
      };
    }

    // 2) Buscar persona por email o documento
    let persona = await GymPersona.findOne({
      where: { gym_persona_email: emailN },
      transaction: t,
    });

    if (!persona) {
      persona = await GymPersona.findOne({
        where: { gym_persona_documento: Number(doc) },
        transaction: t,
      });
    }

    if (!persona) {
      persona = await GymPersona.create(
        {
          gym_persona_nombre: nombre,
          gym_persona_apellido: apellido,
          gym_persona_email: emailN,
          gym_persona_documento: Number(doc),
          gym_persona_fechacambio: new Date(),
        },
        { transaction: t }
      );
    }

    // 3) Buscar usuario de esa persona
    let usuario = await GymUsuario.findOne({
      where: { gym_usuario_rela_persona: persona.gym_persona_id },
      transaction: t,
    });

    if (!usuario) {
      const hash = await bcrypt.hash(pass, 10);
      usuario = await GymUsuario.create(
        {
          gym_usuario_rela_persona: persona.gym_persona_id,
          gym_usuario_contrasena: hash,
          gym_usuario_activo: true,
          gym_usuario_fechacambio: new Date(),
        },
        { transaction: t }
      );
    }

    // 4) Asignar rol si no lo tiene
    await GymUsuarioRol.findOrCreate({
      where: {
        gym_usuario_rol_rela_usuario: usuario.gym_usuario_id,
        gym_usuario_rol_rela_rol: rol.gym_rol_id,
      },
      defaults: {
        gym_usuario_rol_fechacambio: new Date(),
      },
      transaction: t,
    });

    return {
      ok: true,
      codigo: "USUARIO_ROL_OK",
      mensaje: `Usuario creado/asignado correctamente con rol '${rolCodigo}'`,
      usuario_id: usuario.gym_usuario_id,
      persona_id: persona.gym_persona_id,
      email: persona.gym_persona_email,
      rol: rolCodigo,
    };
  });

  return result;
}



export async function seedAdmin(req, res) {
  try {
    const { email, password, nombre, apellido, documento } = req.body ?? {};

    const result = await crearUsuarioConRol({
      email,
      password,
      nombre,
      apellido,
      documento,
      rolCodigo: "admin",
    });

    if (!result.ok) return res.status(400).json(result);
    return res.json(result);
  } catch (e) {
    console.error("seedAdmin:", e);
    return res.status(500).json({
      ok: false,
      codigo: "ERROR_SEED_ADMIN",
      mensaje: "No se pudo crear admin",
    });
  }
}


export async function seedStaff(req, res) {
  try {
    const { email, password, nombre, apellido, documento } = req.body ?? {};

    const result = await crearUsuarioConRol({
      email,
      password,
      nombre,
      apellido,
      documento,
      rolCodigo: "staff",
    });

    if (!result.ok) return res.status(400).json(result);
    return res.json(result);
  } catch (e) {
    console.error("seedStaff:", e);
    return res.status(500).json({
      ok: false,
      codigo: "ERROR_SEED_STAFF",
      mensaje: "No se pudo crear staff",
    });
  }
}
