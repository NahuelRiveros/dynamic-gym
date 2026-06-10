import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../configuracion_servidor/env.js";
import { Persona, Usuario } from "../models/index.js";

function safeStr(v) {
  return String(v ?? "").trim();
}

function crearToken({ usuario_id, persona_id, roles }) {
  const secret = env.JWT_SECRET;
  if (!secret) throw new Error("Falta JWT_SECRET en .env");

  return jwt.sign({ sub: usuario_id, persona_id, roles }, secret, {
    expiresIn: env.JWT_EXPIRES_IN ?? "24h",
  });
}

export async function login({ email, password }) {
  const emailNorm = safeStr(email).toLowerCase();
  const pass = safeStr(password);

  const persona = await Persona.findOne({ where: { email: emailNorm } });
  if (!persona) {
    return { ok: false, codigo: "CREDENCIALES_INVALIDAS", mensaje: "Email o contraseña incorrectos" };
  }

  const usuario = await Usuario.findOne({ where: { persona_id: persona.id } });
  if (!usuario) {
    return { ok: false, codigo: "SIN_USUARIO", mensaje: "La persona no tiene usuario habilitado" };
  }

  if (usuario.activo === false) {
    return { ok: false, codigo: "USUARIO_INACTIVO", mensaje: "Usuario inactivo" };
  }

  const valido = await bcrypt.compare(pass, usuario.contrasena ?? "");
  if (!valido) {
    return { ok: false, codigo: "CREDENCIALES_INVALIDAS", mensaje: "Email o contraseña incorrectos" };
  }

  const rolesRows = await usuario.getRoles({
    attributes: ["codigo"],
    joinTableAttributes: [],
  });

  const roles = rolesRows.map((r) => r.codigo);

  const token = crearToken({ usuario_id: usuario.id, persona_id: persona.id, roles });

  await usuario.update({ ultimo_login: new Date() });

  return {
    ok: true,
    codigo: "LOGIN_OK",
    mensaje: "Login correcto",
    token,
    usuario: {
      usuario_id: usuario.id,
      persona_id: persona.id,
      nombre: persona.nombre,
      apellido: persona.apellido,
      email: persona.email,
      roles,
    },
  };
}
