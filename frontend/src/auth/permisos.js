import { matchPath } from "react-router-dom";
import { BARRA_INFERIOR, MENU_PANEL, PANTALLAS } from "../app/pantallas.js";

const NOMBRES_ROL = { super_admin: "Super admin", admin: "Administrador", staff: "Staff" };

/** Sin roles pedidos entra cualquiera; si no, alcanza con tener uno. El servidor vuelve a validar. */
export function tieneRol(usuario, roles = []) {
  if (!roles.length) return true;
  const propios = usuario?.roles ?? [];
  return roles.some((rol) => propios.includes(rol));
}

const pantalla = (id) => ({ id, ...PANTALLAS[id] });

/** Grupos del menú con solo lo que el usuario puede abrir; un grupo vacío no se muestra. */
export function menuPara(usuario) {
  return MENU_PANEL.map((grupo) => ({
    ...grupo,
    items: grupo.items.map(pantalla).filter((p) => tieneRol(usuario, p.roles)),
  })).filter((grupo) => grupo.items.length > 0);
}

export function barraInferiorPara(usuario) {
  return BARRA_INFERIOR.map(pantalla).filter((p) => tieneRol(usuario, p.roles));
}

/** La pantalla que corresponde a una URL (también las de detalle, como /alumnos/15). */
export function pantallaDeRuta(pathname) {
  const id = Object.keys(PANTALLAS).find((clave) => matchPath(PANTALLAS[clave].ruta, pathname));
  return id ? pantalla(id) : null;
}

/** En una pantalla de detalle queda marcado su ítem del menú (la ficha marca "Alumnos"). */
export function estaActiva(item, actual) {
  return Boolean(actual) && (actual.id === item.id || actual.padre === item.id);
}

export function nombreDeRol(usuario) {
  const rol = ["super_admin", "admin", "staff"].find((r) => usuario?.roles?.includes(r));
  return NOMBRES_ROL[rol] ?? "Usuario";
}
