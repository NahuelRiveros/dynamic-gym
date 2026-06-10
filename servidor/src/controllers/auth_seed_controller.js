import bcrypt from "bcrypt";
import { sequelize } from "../database/sequelize.js";
import { Persona, Usuario, UsuarioRol, Rol } from "../models/index.js";

const normalizarEmail = (v) => String(v ?? "").trim().toLowerCase();
const normalizarDocumento = (v) => String(v ?? "").replace(/[.\s]/g, "").trim();

async function crearUsuarioConRol({ email, password, nombre, apellido, documento, rolCodigo }) {
  const emailN = normalizarEmail(email);
  const pass   = String(password ?? "").trim();
  const doc    = normalizarDocumento(documento);

  if (!emailN || !pass || !nombre || !apellido || !doc || !rolCodigo) {
    return { ok: false, codigo: "FALTAN_DATOS", mensaje: "Requiere: email, password, nombre, apellido, documento, rolCodigo" };
  }

  return sequelize.transaction(async (t) => {
    const rol = await Rol.findOne({ where: { codigo: rolCodigo }, transaction: t });
    if (!rol)
      return { ok: false, codigo: "SIN_ROL", mensaje: `No existe rol '${rolCodigo}'` };

    let persona = await Persona.findOne({ where: { email: emailN }, transaction: t });
    if (!persona)
      persona = await Persona.findOne({ where: { documento: Number(doc) }, transaction: t });

    if (!persona) {
      persona = await Persona.create(
        { nombre, apellido, email: emailN, documento: Number(doc), actualizado_en: new Date() },
        { transaction: t }
      );
    }

    let usuario = await Usuario.findOne({ where: { persona_id: persona.id }, transaction: t });

    if (!usuario) {
      const hash = await bcrypt.hash(pass, 10);
      usuario = await Usuario.create(
        { persona_id: persona.id, contrasena: hash, activo: true, actualizado_en: new Date() },
        { transaction: t }
      );
    }

    await UsuarioRol.findOrCreate({
      where: { usuario_id: usuario.id, rol_id: rol.id },
      defaults: { actualizado_en: new Date() },
      transaction: t,
    });

    return {
      ok: true, codigo: "USUARIO_ROL_OK",
      mensaje: `Usuario creado/asignado correctamente con rol '${rolCodigo}'`,
      usuario_id: usuario.id, persona_id: persona.id, email: persona.email, rol: rolCodigo,
    };
  });
}

export async function seedAdmin(req, res) {
  try {
    const { email, password, nombre, apellido, documento } = req.body ?? {};
    const result = await crearUsuarioConRol({ email, password, nombre, apellido, documento, rolCodigo: "admin" });
    return result.ok ? res.json(result) : res.status(400).json(result);
  } catch (e) {
    console.error("seedAdmin:", e);
    return res.status(500).json({ ok: false, codigo: "ERROR_SEED_ADMIN", mensaje: "No se pudo crear admin" });
  }
}

export async function seedStaff(req, res) {
  try {
    const { email, password, nombre, apellido, documento } = req.body ?? {};
    const result = await crearUsuarioConRol({ email, password, nombre, apellido, documento, rolCodigo: "staff" });
    return result.ok ? res.json(result) : res.status(400).json(result);
  } catch (e) {
    console.error("seedStaff:", e);
    return res.status(500).json({ ok: false, codigo: "ERROR_SEED_STAFF", mensaje: "No se pudo crear staff" });
  }
}
