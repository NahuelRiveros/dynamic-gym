import bcrypt from "bcrypt";
import { login } from "../services/auth_service.js";
import { Persona, Usuario } from "../models/index.js";

export async function loginController(req, res) {
  try {
    const { email, password } = req.body ?? {};
    const result = await login({ email, password });
    return result.ok ? res.json(result) : res.status(401).json(result);
  } catch (error) {
    console.error("loginController:", error);
    return res.status(500).json({ ok: false, codigo: "ERROR_LOGIN", mensaje: "No se pudo hacer login" });
  }
}

export async function meController(req, res) {
  try {
    const persona = await Persona.findByPk(req.user.persona_id, {
      attributes: ["nombre", "apellido", "email"],
    });

    return res.json({
      ok: true,
      usuario: {
        ...req.user,
        nombre:   persona?.nombre   ?? null,
        apellido: persona?.apellido ?? null,
        email:    persona?.email    ?? null,
      },
    });
  } catch (error) {
    console.error("meController:", error);
    return res.status(500).json({ ok: false, codigo: "ERROR_ME", mensaje: "No se pudo obtener sesión" });
  }
}

export async function logoutController(_req, res) {
  return res.json({ ok: true, mensaje: "Logout OK" });
}

export async function resetPasswordController(req, res) {
  try {
    const { email, newPassword } = req.body ?? {};
    if (!email || !newPassword)
      return res.status(400).json({ ok: false, mensaje: "Requerido: email y newPassword" });

    const persona = await Persona.findOne({
      where: { email: String(email).trim().toLowerCase() },
    });
    if (!persona)
      return res.status(404).json({ ok: false, mensaje: "Email no encontrado" });

    const usuario = await Usuario.findOne({ where: { persona_id: persona.id } });
    if (!usuario)
      return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado" });

    const hash = await bcrypt.hash(String(newPassword).trim(), 10);
    await usuario.update({ contrasena: hash });

    return res.json({ ok: true, mensaje: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("resetPasswordController:", error);
    return res.status(500).json({ ok: false, mensaje: "No se pudo resetear la contraseña" });
  }
}
