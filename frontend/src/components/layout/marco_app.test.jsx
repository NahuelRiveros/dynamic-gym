import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderizar } from "../../test/renderizar.jsx";
import { sesionComo } from "../../test/servidor_mock.js";
import MarcoApp from "./marco_app.jsx";

const panel = (
  <MarcoApp>
    <p>Contenido de la pantalla</p>
  </MarcoApp>
);
const menuPrincipal = () => screen.findByRole("navigation", { name: "Menú principal" });

describe("Panel: barra lateral, barra inferior y título", () => {
  it("sin sesión muestra la barra pública y ninguna parte del panel", async () => {
    renderizar(panel, { ruta: "/consulta-plan" });

    expect(await screen.findByRole("link", { name: "Ingresar" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Mi Plan" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("navigation", { name: "Menú principal" })).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Accesos rápidos" })).not.toBeInTheDocument();
  });

  it("el login y Mi Plan van sin el footer largo; el inicio lo mantiene", async () => {
    const { unmount } = renderizar(panel, { ruta: "/login" });
    expect(await screen.findByRole("link", { name: "Ingresar" })).toBeInTheDocument();
    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
    unmount();

    renderizar(panel, { ruta: "/" });
    expect(await screen.findByRole("contentinfo")).toBeInTheDocument();
  });

  it("el staff ve sus tareas del día y no ve la configuración del gimnasio", async () => {
    sesionComo({ roles: ["staff"] });
    renderizar(panel, { ruta: "/kiosk" });

    const menu = within(await menuPrincipal());
    expect(await menu.findByRole("link", { name: "Ingreso" })).toHaveAttribute("aria-current", "page");
    expect(menu.getByRole("link", { name: "Cobrar plan" })).toBeInTheDocument();
    expect(menu.queryByRole("link", { name: "Planes" })).not.toBeInTheDocument();
    expect(menu.queryByText("Reportes")).not.toBeInTheDocument();
  });

  it("en una ficha de alumno el título lo dice y queda marcado \"Alumnos\" en el menú", async () => {
    sesionComo({ roles: ["admin"] });
    renderizar(panel, { ruta: "/admin/estadisticas/alumnos/15", rutaDelUi: "/admin/estadisticas/alumnos/:id" });

    const menu = within(await menuPrincipal());
    expect(await menu.findByRole("link", { name: "Alumnos" })).toHaveAttribute("aria-current", "page");
    const encabezado = within(screen.getByRole("banner"));
    expect(encabezado.getByText("Ficha del alumno")).toBeInTheDocument();
    expect(encabezado.getByText("Recepción")).toBeInTheDocument();
  });

  it("en el celular, \"Más\" abre el menú completo y se cierra con Escape", async () => {
    const usuario = userEvent.setup();
    sesionComo({ roles: ["admin"] });
    renderizar(panel, { ruta: "/admin/ventas" });

    const accesos = within(await screen.findByRole("navigation", { name: "Accesos rápidos" }));
    await usuario.click(await accesos.findByRole("button", { name: "Más" }));

    const hoja = within(screen.getByRole("navigation", { name: "Menú completo" }));
    expect(hoja.getByRole("link", { name: "Ventas" })).toHaveAttribute("aria-current", "page");
    expect(hoja.getByRole("link", { name: "Promociones" })).toBeInTheDocument();

    fireEvent(screen.getByRole("dialog", { name: "Menú" }), new Event("cancel", { cancelable: true })); // lo que hace el navegador con Escape
    expect(screen.queryByRole("navigation", { name: "Menú completo" })).not.toBeInTheDocument();
  });

  it("achicar la barra lateral deja solo los íconos y se recuerda", async () => {
    const usuario = userEvent.setup();
    sesionComo({ roles: ["admin"] });
    renderizar(panel, { ruta: "/kiosk" });

    await usuario.click(await screen.findByRole("button", { name: "Achicar menú" }));

    expect(screen.getByRole("button", { name: "Agrandar menú" })).toBeInTheDocument();
    expect(localStorage.getItem("dg_menu_achicado")).toBe("1");
    expect(within(await menuPrincipal()).getByRole("link", { name: "Ingreso" })).toHaveAttribute("title", "Ingreso");
  });
});
