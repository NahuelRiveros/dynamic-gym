import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { plata } from "../../lib/dinero.js";
import { renderizar } from "../../test/renderizar.jsx";
import { API, servidorMock, sesionComo } from "../../test/servidor_mock.js";
import SuscripcionPage from "./suscripcion_page.jsx";

const ESTADO = { ok: true, cliente_nombre: "Dynamic Gym", plan_nombre: "Plan Mensual", precio: 60000, fecha_vencimiento: "2026-11-01", dias_aviso: 10, dias_gracia: 3 };
const conEstado = (extra) => servidorMock.use(http.get(`${API}/suscripcion/estado`, () => HttpResponse.json({ ...ESTADO, ...extra })));

describe("Suscripción (admin del gimnasio)", () => {
  it("muestra cuándo vence, el precio y cómo pagar, con las reglas reales del ciclo", async () => {
    conEstado({ estado: "activo", dias_restantes: 23 });
    sesionComo({ roles: ["admin"] });
    renderizar(<SuscripcionPage />, { ruta: "/admin/suscripcion" });

    expect(await screen.findByText("Vence el 01/11/2026 · faltan 23 días.")).toBeInTheDocument();
    expect(screen.getAllByText(plata(60000).replace(/\s/g, " ")).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Copiar alias" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Enviar comprobante por WhatsApp/ })).toHaveAttribute("href", expect.stringContaining("wa.me/"));
    // La gracia es de 3 días (lo que dice el servidor), no "del 1 al 10" como decía antes.
    expect(screen.getByText(/hasta 3 días después del vencimiento/)).toBeInTheDocument();
    expect(screen.getByText(/Al día: hasta 10 días antes/).closest("li")).toHaveAttribute("aria-current", "step");
  });

  it("en el período de gracia dice cuántos días quedan para pagar", async () => {
    conEstado({ estado: "gracia", dias_restantes: -1, dias_gracia_restantes: 2 });
    sesionComo({ roles: ["admin"] });
    renderizar(<SuscripcionPage />, { ruta: "/admin/suscripcion" });

    expect(await screen.findByText("Venció el 01/11/2026. Te quedan 2 días de gracia para pagar.")).toBeInTheDocument();
  });

  it("sin suscripción configurada lo dice y a quién escribirle", async () => {
    servidorMock.use(http.get(`${API}/suscripcion/estado`, () => HttpResponse.json({ ok: false, estado: "sin_suscripcion", mensaje: "No hay suscripción configurada." })));
    sesionComo({ roles: ["admin"] });
    renderizar(<SuscripcionPage />, { ruta: "/admin/suscripcion" });

    expect(await screen.findByRole("alert")).toHaveTextContent("Escribile a Nahuel para activarla.");
  });
});
