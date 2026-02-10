import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../configuracion_servidor/env.js";
import { GymPersona, GymUsuario, GymRol } from "../models/index.js";

function safeStr(v) {
  return String(v ?? "").trim();
}

function crearToken({ usuario_id, persona_id, roles }) {
  const secret = env.JWT_SECRET;
  if (!secret) throw new Error("Falta JWT_SECRET en .env");

  const payload = {
    sub: usuario_id,
    persona_id,
    roles,
  };

  return jwt.sign(payload, secret, {
    expiresIn: env.JWT_EXPIRES_IN ?? "1h",
  });
}

/**
 * Login por email + password
 * - email se busca en gym_persona
 * - password se valida contra gym_usuario.gym_usuario_contrasena (bcrypt hash)
 * - roles se obtienen desde relación GymUsuario <-> GymRol
 */
export async function login({ email, password }) {
  const emailNorm = safeStr(email).toLowerCase();
  const pass = safeStr(password);

  if (!emailNorm || !pass) {
    return { ok: false, codigo: "FALTAN_DATOS", mensaje: "Email y contraseña son obligatorios" };
  }

  // 1) Persona por email
  const persona = await GymPersona.findOne({
    where: { gym_persona_email: emailNorm },
  });

  if (!persona) {
    return { ok: false, codigo: "CREDENCIALES_INVALIDAS", mensaje: "Email o contraseña incorrectos" };
  }

  // 2) Usuario asociado a esa persona
  const usuario = await GymUsuario.findOne({
    where: { gym_usuario_rela_persona: persona.gym_persona_id },
  });

  if (!usuario) {
    return { ok: false, codigo: "SIN_USUARIO", mensaje: "La persona no tiene usuario habilitado" };
  }

  // 3) Activo
  if (usuario.gym_usuario_activo === false) {
    return { ok: false, codigo: "USUARIO_INACTIVO", mensaje: "Usuario inactivo" };
  }

  // 4) Validar bcrypt
  const hash = usuario.gym_usuario_contrasena ?? "";
  const valido = await bcrypt.compare(pass, hash);

  if (!valido) {
    return { ok: false, codigo: "CREDENCIALES_INVALIDAS", mensaje: "Email o contraseña incorrectos" };
  }

  // 5) Roles
  const rolesRows = await usuario.getGymRols({
    attributes: ["gym_rol_codigo"],
    joinTableAttributes: [],
  });

  const roles = rolesRows.map((r) => r.gym_rol_codigo);

  // 6) Token
  const token = crearToken({
    usuario_id: usuario.gym_usuario_id,
    persona_id: persona.gym_persona_id,
    roles,
  });

  // 7) actualizar último login
  await usuario.update({ gym_usuario_ultimo_login: new Date() });

  return {
    ok: true,
    codigo: "LOGIN_OK",
    mensaje: "Login correcto",
    token,
    usuario: {
      usuario_id: usuario.gym_usuario_id,
      persona_id: persona.gym_persona_id,
      nombre: persona.gym_persona_nombre,
      apellido: persona.gym_persona_apellido,
      email: persona.gym_persona_email,
      roles,
    },
  };
}
