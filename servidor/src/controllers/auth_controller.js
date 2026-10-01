import bcrypt from "bcrypt";
import { login } from "../services/auth_service.js";
import { Persona, Usuario } from "../models_v2/index.js";

export async function loginController(req, res) {
  const { email, password } = req.body ?? {};
  const result = await login({ email, password });
  return result.ok ? res.json(result) : res.status(401).json(result);
}

export async function meController(req, res) {
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
}

export async function logoutController(_req, res) {
  return res.json({ ok: true, mensaje: "Logout OK" });
}

export async function resetPasswordController(req, res) {
  const { email, newPassword } = req.datos.body;

  const persona = await Persona.findOne({ where: { email } });
  if (!persona)
    return res.status(404).json({ ok: false, mensaje: "Email no encontrado" });

  const usuario = await Usuario.findOne({ where: { persona_id: persona.id } });
  if (!usuario)
    return res.status(404).json({ ok: false, mensaje: "Usuario no encontrado" });

  const hash = await bcrypt.hash(newPassword, 10);
  await usuario.update({ contrasena: hash });

  return res.json({ ok: true, mensaje: "Contraseña actualizada correctamente" });
}
