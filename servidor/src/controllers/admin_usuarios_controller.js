import { crearUsuarioConRoles, listarUsuarios } from "../services/admin_usuarios_service.js";

export async function crearUsuarioController(req, res) {
  const result = await crearUsuarioConRoles(req.body ?? {}, { solicitante_roles: req.user.roles });
  if (!result.ok) return res.status(result.codigo === "SIN_PERMISO" ? 403 : 400).json(result);
  return res.json(result);
}

export async function listarUsuariosController(req, res) {
  const { buscar, rol, activo, page, limit } = req.query ?? {};
  const result = await listarUsuarios({ buscar, rol, activo, page, limit });
  return res.json(result);
}
