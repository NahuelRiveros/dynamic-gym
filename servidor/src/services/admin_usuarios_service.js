import bcrypt from "bcrypt";
import { sequelize } from "../database/sequelize.js";
import { Op } from "sequelize";
import { GymPersona, GymUsuario, GymUsuarioRol, GymRol } from "../models/index.js";

const normalizarEmail = (v) => String(v ?? "").trim().toLowerCase();
const normalizarDocumento = (v) => String(v ?? "").replace(/[.\s]/g, "").trim();

export async function crearUsuarioConRoles(data) {
  const personaId = data.persona_id ? Number(data.persona_id) : null;
  const email = normalizarEmail(data.email);
  const documento = data.documento ? normalizarDocumento(data.documento) : null;
  const password = String(data.password ?? "").trim();
  const roles = Array.isArray(data.roles) ? data.roles.map(Number) : [];

  if (!password || password.length < 4) {
    return { ok: false, codigo: "PASSWORD_INVALIDO", mensaje: "Password obligatorio (mínimo 4 caracteres)" };
  }

  if (!roles.length) {
    return { ok: false, codigo: "ROLES_REQUERIDOS", mensaje: "Debés enviar roles: [1] admin, [2] staff" };
  }

  return sequelize.transaction(async (t) => {
    // 1) Obtener o crear persona
    let persona = null;

    if (personaId) {
      persona = await GymPersona.findByPk(personaId, { transaction: t });
      if (!persona) {
        return { ok: false, codigo: "PERSONA_NO_EXISTE", mensaje: "No existe persona_id" };
      }
    } else {
      // si no mandan persona_id, necesitamos mínimo email o documento + nombre/apellido
      if (!email && !documento) {
        return { ok: false, codigo: "FALTAN_DATOS", mensaje: "Enviá persona_id o email/documento" };
      }

      // buscar por email (mejor) o documento
      persona = email
        ? await GymPersona.findOne({ where: { gym_persona_email: email }, transaction: t })
        : null;

      if (!persona && documento) {
        persona = await GymPersona.findOne({ where: { gym_persona_documento: documento }, transaction: t });
      }

      // si no existe, crear persona
      if (!persona) {
        const nombre = String(data.nombre ?? "").trim();
        const apellido = String(data.apellido ?? "").trim();

        if (!nombre || !apellido) {
          return { ok: false, codigo: "FALTAN_DATOS_PERSONA", mensaje: "Si no existe persona, enviá nombre y apellido" };
        }

        persona = await GymPersona.create(
          {
            gym_persona_nombre: nombre,
            gym_persona_apellido: apellido,
            gym_persona_email: email || null,
            gym_persona_documento: documento ? Number(documento) : null,
          },
          { transaction: t }
        );
      }
    }

    // 2) Verificar si ya hay usuario para esa persona
    const yaUsuario = await GymUsuario.findOne({
      where: { gym_usuario_rela_persona: persona.gym_persona_id },
      transaction: t,
    });

    if (yaUsuario) {
      return { ok: false, codigo: "YA_TIENE_USUARIO", mensaje: "Esa persona ya tiene un usuario" };
    }

    // 3) Crear usuario con bcrypt hash
    const hash = await bcrypt.hash(password, 10);

    const usuario = await GymUsuario.create(
      {
        gym_usuario_rela_persona: persona.gym_persona_id,
        gym_usuario_contrasena: hash,
        gym_usuario_activo: true,
        gym_usuario_fechacambio: new Date(),
      },
      { transaction: t }
    );

    // 4) Validar roles existentes
    const rolesDb = await GymRol.findAll({
      where: { gym_rol_id: roles },
      transaction: t,
    });

    if (rolesDb.length !== roles.length) {
      return { ok: false, codigo: "ROL_INVALIDO", mensaje: "Alguno de los roles enviados no existe" };
    }

    // 5) Insertar en tabla puente
    for (const rolId of roles) {
      await GymUsuarioRol.create(
        {
          gym_usuario_rol_rela_usuario: usuario.gym_usuario_id,
          gym_usuario_rol_rela_rol: rolId,
          gym_usuario_rol_fechacambio: new Date(),
        },
        { transaction: t }
      );
    }

    return {
      ok: true,
      codigo: "USUARIO_CREADO",
      mensaje: "Usuario creado correctamente",
      usuario: {
        gym_usuario_id: usuario.gym_usuario_id,
        persona_id: persona.gym_persona_id,
        email: persona.gym_persona_email,
        nombre: persona.gym_persona_nombre,
        apellido: persona.gym_persona_apellido,
        roles: rolesDb.map((r) => ({ id: r.gym_rol_id, codigo: r.gym_rol_codigo })),
      },
    };
  });
}

function parseBool(v) {
  if (v === undefined || v === null || v === "") return null;
  const s = String(v).toLowerCase().trim();
  if (["true", "1", "yes", "si"].includes(s)) return true;
  if (["false", "0", "no"].includes(s)) return false;
  return null;
}

function parseIntSafe(v, def) {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : def;
}

export async function listarUsuarios({ buscar, rol, activo, page, limit }) {
  const pagina = Math.max(1, parseIntSafe(page, 1));
  const limite = Math.min(100, Math.max(1, parseIntSafe(limit, 20)));
  const offset = (pagina - 1) * limite;

  const activoBool = parseBool(activo);

  // filtro de búsqueda (persona)
  const q = String(buscar ?? "").trim();
  const wherePersona = q
    ? {
        [Op.or]: [
          { gym_persona_nombre: { [Op.iLike]: `%${q}%` } },
          { gym_persona_apellido: { [Op.iLike]: `%${q}%` } },
          { gym_persona_email: { [Op.iLike]: `%${q}%` } },
          // documento es bigint, buscamos por string
          // sequelize con iLike no aplica a bigint, lo pasamos a string en el frontend normalmente
        ],
      }
    : undefined;

  // filtro usuario
  const whereUsuario = {};
  if (activoBool !== null) whereUsuario.gym_usuario_activo = activoBool;

  // filtro rol (por código)
  const rolCod = String(rol ?? "").trim().toLowerCase();
  const filtrarRol = rolCod ? { gym_rol_codigo: rolCod } : null;

  // include roles con filtro opcional
  const includeRoles = {
    model: GymRol,
    attributes: ["gym_rol_id", "gym_rol_codigo", "gym_rol_descripcion"],
    through: { attributes: [] },
    required: !!filtrarRol,
    ...(filtrarRol ? { where: filtrarRol } : {}),
  };

  const { rows, count } = await GymUsuario.findAndCountAll({
    where: whereUsuario,
    attributes: [
      "gym_usuario_id",
      "gym_usuario_rela_persona",
      "gym_usuario_activo",
      "gym_usuario_ultimo_login",
      "gym_usuario_fechacambio",
    ],
    include: [
      {
        model: GymPersona,
        attributes: [
          "gym_persona_id",
          "gym_persona_nombre",
          "gym_persona_apellido",
          "gym_persona_email",
          "gym_persona_documento",
        ],
        required: true,
        ...(wherePersona ? { where: wherePersona } : {}),
      },
      includeRoles,
    ],
    order: [["gym_usuario_id", "DESC"]],
    limit: limite,
    offset,
    distinct: true, // IMPORTANT para count con N:N
  });

  return {
    ok: true,
    page: pagina,
    limit: limite,
    total: count,
    items: rows.map((u) => ({
      usuario_id: u.gym_usuario_id,
      activo: u.gym_usuario_activo,
      ultimo_login: u.gym_usuario_ultimo_login,
      persona: {
        persona_id: u.GymPersona?.gym_persona_id,
        nombre: u.GymPersona?.gym_persona_nombre,
        apellido: u.GymPersona?.gym_persona_apellido,
        email: u.GymPersona?.gym_persona_email,
        documento: u.GymPersona?.gym_persona_documento,
      },
      roles: (u.GymRols ?? []).map((r) => ({
        id: r.gym_rol_id,
        codigo: r.gym_rol_codigo,
        descripcion: r.gym_rol_descripcion,
      })),
    })),
  };
}
