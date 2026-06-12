import bcrypt from "bcrypt";
import { Op } from "sequelize";
import { sequelize } from "../database/sequelize.js";
import { Persona, Usuario, UsuarioRol, Rol } from "../models_v2/index.js";

const normalizarEmail = (v) => String(v ?? "").trim().toLowerCase();
const normalizarDocumento = (v) => String(v ?? "").replace(/[.\s]/g, "").trim();

const ahoraArgentina = () =>
  sequelize.literal(`TIMEZONE('America/Argentina/Cordoba', CURRENT_TIMESTAMP)`);

export async function listarStaff() {
  const rolStaff = await Rol.findOne({ where: { codigo: "staff" } });
  if (!rolStaff) return [];

  const relaciones = await UsuarioRol.findAll({
    where: { rol_id: rolStaff.id },
    include: [
      {
        model: Usuario,
        as: "usuario",
        include: [
          {
            model: Persona,
            as: "persona",
            attributes: ["id", "nombre", "apellido", "email", "documento", "actualizado_en"],
          },
        ],
        attributes: ["id", "persona_id", "activo", "actualizado_en", "ultimo_login"],
      },
      {
        model: Rol,
        as: "rol",
        attributes: ["id", "codigo", "descripcion"],
      },
    ],
    order: [["id", "DESC"]],
  });

  return relaciones.map((rel) => ({
    gym_usuario_rol_id:    rel.id,
    gym_usuario_id:        rel.usuario?.id,
    gym_usuario_activo:    rel.usuario?.activo,
    gym_usuario_fechacambio: rel.usuario?.actualizado_en,
    gym_usuario_ultimo_login: rel.usuario?.ultimo_login,

    gym_persona_id:        rel.usuario?.persona?.id,
    gym_persona_nombre:    rel.usuario?.persona?.nombre,
    gym_persona_apellido:  rel.usuario?.persona?.apellido,
    gym_persona_email:     rel.usuario?.persona?.email,
    gym_persona_documento: rel.usuario?.persona?.documento,
    gym_persona_fechacambio: rel.usuario?.persona?.actualizado_en,

    rol_id:          rel.rol?.id,
    rol_codigo:      rel.rol?.codigo,
    rol_descripcion: rel.rol?.descripcion,
  }));
}

export async function crearStaff({ email, password, nombre, apellido, documento }) {
  const emailN    = normalizarEmail(email);
  const pass      = String(password ?? "").trim();
  const doc       = normalizarDocumento(documento);
  const nombreN   = String(nombre ?? "").trim();
  const apellidoN = String(apellido ?? "").trim();

  if (!emailN || !pass || !nombreN || !apellidoN || !doc)
    return { ok: false, codigo: "FALTAN_DATOS", mensaje: "Requiere: email, password, nombre, apellido y documento" };
  if (pass.length < 4)
    return { ok: false, codigo: "PASSWORD_INVALIDA", mensaje: "La contraseña debe tener al menos 4 caracteres" };
  if (!/^\d+$/.test(doc))
    return { ok: false, codigo: "DOCUMENTO_INVALIDO", mensaje: "El documento debe contener solo números" };

  return await sequelize.transaction(async (t) => {
    const rolStaff = await Rol.findOne({ where: { codigo: "staff" }, transaction: t });
    if (!rolStaff)
      return { ok: false, codigo: "SIN_ROL_STAFF", mensaje: "No existe el rol 'staff' en la tabla rol" };

    let persona = await Persona.findOne({
      where: { [Op.or]: [{ email: emailN }, { documento: doc }] },
      transaction: t,
    });

    if (persona) {
      const usuarioExistente = await Usuario.findOne({
        where: { persona_id: persona.id },
        transaction: t,
      });

      if (usuarioExistente) {
        const yaTieneRol = await UsuarioRol.findOne({
          where: { usuario_id: usuarioExistente.id, rol_id: rolStaff.id },
          transaction: t,
        });

        if (yaTieneRol)
          return { ok: false, codigo: "STAFF_YA_EXISTE", mensaje: "La persona ya tiene un usuario con rol staff" };

        await UsuarioRol.create(
          { usuario_id: usuarioExistente.id, rol_id: rolStaff.id, actualizado_en: ahoraArgentina() },
          { transaction: t }
        );

        return {
          ok: true, codigo: "ROL_STAFF_ASIGNADO",
          mensaje: "Se asignó el rol staff a un usuario existente",
          usuario_id: usuarioExistente.id, persona_id: persona.id,
          email: persona.email, rol: "staff",
        };
      }

      const hash = await bcrypt.hash(pass, 10);
      const nuevoUsuario = await Usuario.create(
        { persona_id: persona.id, contrasena: hash, activo: true, actualizado_en: ahoraArgentina() },
        { transaction: t }
      );

      await UsuarioRol.create(
        { usuario_id: nuevoUsuario.id, rol_id: rolStaff.id, actualizado_en: ahoraArgentina() },
        { transaction: t }
      );

      return {
        ok: true, codigo: "USUARIO_STAFF_CREADO", mensaje: "Staff creado correctamente",
        usuario_id: nuevoUsuario.id, persona_id: persona.id, email: persona.email, rol: "staff",
      };
    }

    persona = await Persona.create(
      { nombre: nombreN, apellido: apellidoN, email: emailN, documento: doc, actualizado_en: ahoraArgentina() },
      { transaction: t }
    );

    const hash = await bcrypt.hash(pass, 10);
    const usuario = await Usuario.create(
      { persona_id: persona.id, contrasena: hash, activo: true, actualizado_en: ahoraArgentina() },
      { transaction: t }
    );

    await UsuarioRol.create(
      { usuario_id: usuario.id, rol_id: rolStaff.id, actualizado_en: ahoraArgentina() },
      { transaction: t }
    );

    return {
      ok: true, codigo: "USUARIO_STAFF_CREADO", mensaje: "Staff creado correctamente",
      usuario_id: usuario.id, persona_id: persona.id, email: persona.email, rol: "staff",
    };
  });
}

export async function actualizarStaff(usuarioId, data) {
  const emailN    = normalizarEmail(data.email);
  const doc       = normalizarDocumento(data.documento);
  const nombreN   = String(data.nombre ?? "").trim();
  const apellidoN = String(data.apellido ?? "").trim();

  if (!nombreN || !apellidoN || !emailN || !doc)
    return { ok: false, codigo: "FALTAN_DATOS", mensaje: "Requiere: nombre, apellido, email y documento" };
  if (!/^\d+$/.test(doc))
    return { ok: false, codigo: "DOCUMENTO_INVALIDO", mensaje: "El documento debe contener solo números" };

  return await sequelize.transaction(async (t) => {
    const usuario = await Usuario.findByPk(usuarioId, {
      include: [{ model: Persona, as: "persona" }],
      transaction: t,
    });

    if (!usuario || !usuario.persona)
      return { ok: false, codigo: "NO_ENCONTRADO", mensaje: "Staff no encontrado" };

    const otraConEmail = await Persona.findOne({
      where: { email: emailN, id: { [Op.ne]: usuario.persona.id } },
      transaction: t,
    });
    if (otraConEmail)
      return { ok: false, codigo: "EMAIL_DUPLICADO", mensaje: "Ya existe una persona con ese email" };

    const otraConDoc = await Persona.findOne({
      where: { documento: doc, id: { [Op.ne]: usuario.persona.id } },
      transaction: t,
    });
    if (otraConDoc)
      return { ok: false, codigo: "DOCUMENTO_DUPLICADO", mensaje: "Ya existe una persona con ese documento" };

    await usuario.persona.update(
      { nombre: nombreN, apellido: apellidoN, email: emailN, documento: doc, actualizado_en: ahoraArgentina() },
      { transaction: t }
    );
    await usuario.update({ actualizado_en: ahoraArgentina() }, { transaction: t });

    return {
      ok: true, codigo: "STAFF_ACTUALIZADO", mensaje: "Staff actualizado correctamente",
      usuario_id: usuario.id, persona_id: usuario.persona.id,
    };
  });
}

export async function cambiarPasswordStaff(usuarioId, nuevaPassword) {
  const pass = String(nuevaPassword ?? "").trim();

  if (!pass || pass.length < 4)
    return { ok: false, codigo: "PASSWORD_INVALIDA", mensaje: "La contraseña debe tener al menos 4 caracteres" };

  const usuario = await Usuario.findByPk(usuarioId);
  if (!usuario)
    return { ok: false, codigo: "NO_ENCONTRADO", mensaje: "Staff no encontrado" };

  const hash = await bcrypt.hash(pass, 10);
  await usuario.update({ contrasena: hash, actualizado_en: ahoraArgentina() });

  return { ok: true, codigo: "PASSWORD_ACTUALIZADA", mensaje: "Contraseña actualizada correctamente" };
}

export async function cambiarEstadoStaff(usuarioId, activo) {
  const usuario = await Usuario.findByPk(usuarioId);
  if (!usuario)
    return { ok: false, codigo: "NO_ENCONTRADO", mensaje: "Staff no encontrado" };

  await usuario.update({ activo, actualizado_en: ahoraArgentina() });

  return {
    ok: true, codigo: "ESTADO_ACTUALIZADO",
    mensaje: activo ? "Staff activado correctamente" : "Staff desactivado correctamente",
  };
}
