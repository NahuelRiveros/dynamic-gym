import { describe, expect, it } from "vitest";
import { PANTALLAS } from "../app/pantallas.js";
import { barraInferiorPara, estaActiva, menuPara, nombreDeRol, pantallaDeRuta, tieneRol } from "./permisos.js";

const staff = { roles: ["staff"] };
const admin = { roles: ["admin"] };
const titulos = (menu) => menu.flatMap((g) => g.items.map((i) => i.titulo));

describe("Permisos del menú", () => {
  it("el staff solo ve Recepción (con Ventas, para vender en el mostrador) y ahí no ve Corregir plan", () => {
    const menu = menuPara(staff);

    expect(menu.map((g) => g.id)).toEqual(["principal", "recepcion"]);
    expect(titulos(menu)).toEqual(["Sitio web", "Accesos rápidos", "Ingreso", "Alumnos", "Nuevo alumno", "Cobrar plan", "Ventas"]);
    expect(barraInferiorPara(staff).map((p) => p.titulo)).toEqual(["Ingreso", "Alumnos", "Cobrar plan"]);
  });

  it("el admin ve todo menos lo del super admin", () => {
    const vistos = titulos(menuPara(admin));

    expect(vistos).toContain("Planes");
    expect(vistos).toContain("Recaudación");
    expect(vistos).not.toContain("Suscripción del sistema");
  });

  it("sin sesión no hay ninguna pantalla del panel", () => {
    expect(titulos(menuPara(null))).toEqual(["Sitio web", "Accesos rápidos"]);
    expect(barraInferiorPara(null)).toEqual([]);
    expect(tieneRol(null, ["staff"])).toBe(false);
  });

  it("todas las pantallas del panel piden rol (ninguna queda pública por olvido)", () => {
    const publicas = Object.entries(PANTALLAS).filter(([, p]) => !p.roles).map(([id]) => id);

    expect(publicas).toEqual(["inicio", "paginaGimnasio", "login", "consultaPlan", "pagoExitoso", "pagoFallido"]);
  });

  it("una pantalla de detalle marca su ítem del menú", () => {
    const ficha = pantallaDeRuta("/admin/estadisticas/alumnos/15");

    expect(ficha.titulo).toBe("Ficha del alumno");
    expect(estaActiva({ id: "alumnos" }, ficha)).toBe(true);
    expect(estaActiva({ id: "ventas" }, ficha)).toBe(false);
    expect(pantallaDeRuta("/no-existe")).toBeNull();
  });

  it("muestra el rol con un nombre claro", () => {
    expect(nombreDeRol({ roles: ["super_admin"] })).toBe("Super admin");
    expect(nombreDeRol(staff)).toBe("Staff");
    expect(nombreDeRol({ roles: [] })).toBe("Usuario");
  });
});
