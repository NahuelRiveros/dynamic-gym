import jwt from "jsonwebtoken";
import { env } from "../configuracion_servidor/env.js";

export function requireAuth(req, res, next) {
  try {
    const secret = env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({
        ok: false,
        codigo: "FALTA_JWT_SECRET",
        mensaje: "Config faltante",
      });
    }

    const auth = req.headers.authorization ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) {
      return res.status(401).json({
        ok: false,
        codigo: "NO_AUTH",
        mensaje: "No autorizado (sin token)",
      });
    }

    const payload = jwt.verify(token, secret);

    req.user = {
      usuario_id: payload.sub,
      persona_id: payload.persona_id,
      roles: payload.roles ?? [],
    };

    console.log("✅ Usuario autenticado:", req.user);
    return next();
  } catch (error) {
    console.error("JWT ERROR >>>", error.name, error.message);
    return res.status(401).json({
      ok: false,
      codigo: "TOKEN_INVALIDO",
      mensaje: "Token inválido o vencido",
    });
  }
}

// ✅ ahora soporta varios roles como vos lo estás usando
export function requireRole(...rolesPermitidos) {
  return (req, res, next) => {
    const roles = req.user?.roles ?? [];
    const tiene = roles.some((r) => rolesPermitidos.includes(r));

    if (!tiene) {
      return res.status(403).json({
        ok: false,
        codigo: "SIN_PERMISO",
        mensaje: "No tenés permisos",
      });
    }

    return next();
  };
}
