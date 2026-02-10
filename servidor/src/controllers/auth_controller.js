import jwt from "jsonwebtoken";
import { login } from "../services/auth_service.js";

export async function loginController(req, res) {
  try {
    const { email, password } = req.body ?? {};
    const result = await login({ email, password });

    if (!result.ok) {
      return res.status(401).json(result);
    }

    // ✅ Opción simple (para empezar): devolver token en JSON
    return res.json(result);

    // ✅ Opción más segura (cookie httpOnly) - si querés la activamos luego:
    // res.cookie("access_token", result.token, {
    //   httpOnly: true,
    //   sameSite: "lax",
    //   secure: false, // true en https
    //   maxAge: 60 * 60 * 1000,
    // });
    // return res.json({ ok: true, usuario: result.usuario });

  } catch (error) {
    console.error("loginController:", error);
    return res.status(500).json({
      ok: false,
      codigo: "ERROR_LOGIN",
      mensaje: "No se pudo hacer login",
    });
  }
}

export async function meController(req, res) {
  try {
    // Este controller asume que ya pasaste por requireAuth
    return res.json({
      ok: true,
      user: req.user,
    });
  } catch (error) {
    console.error("meController:", error);
    return res.status(500).json({ ok: false, codigo: "ERROR_ME", mensaje: "No se pudo obtener sesión" });
  }
}

export async function logoutController(req, res) {
  try {
    // Si usás cookie:
    // res.clearCookie("access_token");
    return res.json({ ok: true, mensaje: "Logout OK" });
  } catch (error) {
    console.error("logoutController:", error);
    return res.status(500).json({ ok: false, codigo: "ERROR_LOGOUT", mensaje: "No se pudo cerrar sesión" });
  }
}
