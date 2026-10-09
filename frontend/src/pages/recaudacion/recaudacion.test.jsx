import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { renderizar } from "../../test/renderizar.jsx";
import { API, servidorMock } from "../../test/servidor_mock.js";
import RecaudacionAnualPage from "./recaudacion_anual_page.jsx";
import RecaudacionDiaPage from "./recaudacion_dia_page.jsx";
import RecaudacionMesPage from "./recaudacion_mes_page.jsx";
import { plata } from "./formato.js";

// Testing Library junta los espacios de la pantalla pero no los del texto buscado: sin el espacio especial de toLocaleString.
const texto = (monto) => plata(monto).replace(/\s/g, " ");

const meses = (porMes) =>
  Array.from({ length: 12 }, (_, i) => {
    const { planes = 0, productos = 0 } = porMes[i + 1] ?? {};
    return { mes: i + 1, planes, productos, total: planes + productos };
  });

describe("Recaudación del año", () => {
  it("suma planes y productos, marca el mejor mes y compara con el año anterior", async () => {
    servidorMock.use(
      http.get(`${API}/recaudacion/mensual`, ({ request }) => {
        const anio = Number(new URL(request.url).searchParams.get("anio"));
        const datos = anio === 2024 ? meses({ 3: { planes: 50000 } }) : meses({ 3: { planes: 40000, productos: 5000 }, 5: { planes: 15000 } });
        return HttpResponse.json({ ok: true, anio, items: datos });
      }),
    );
    renderizar(<RecaudacionAnualPage />, { ruta: "/estadisticas/recaudaciones-mensual?anio=2025", rutaDelUi: "/estadisticas/recaudaciones-mensual" });

    expect(await screen.findByRole("heading", { name: "Recaudación 2025" })).toBeInTheDocument();
    expect(await screen.findByText(texto(60000))).toBeInTheDocument();
    expect(screen.getByText("+20% vs. 2024")).toBeInTheDocument();
    expect(screen.getByText("Mejor mes").parentElement).toHaveTextContent("Marzo");
    // Cada barra dice su monto (no depende solo del color).
    expect(screen.getByRole("button", { name: `Marzo: ${plata(45000)} (planes ${plata(40000)}, productos ${plata(5000)})` })).toBeInTheDocument();
  });

  it("un año sin cobros lo dice en vez de mostrar un gráfico vacío", async () => {
    servidorMock.use(http.get(`${API}/recaudacion/mensual`, () => HttpResponse.json({ ok: true, items: meses({}) })));
    renderizar(<RecaudacionAnualPage />, { ruta: "/estadisticas/recaudaciones-mensual?anio=2021", rutaDelUi: "/estadisticas/recaudaciones-mensual" });

    expect(await screen.findByText("No hay cobros registrados en 2021.")).toBeInTheDocument();
  });

  it("si el servidor falla muestra el error con Reintentar", async () => {
    servidorMock.use(http.get(`${API}/recaudacion/mensual`, () => HttpResponse.json({ ok: false, mensaje: "Error interno" }, { status: 500 })));
    renderizar(<RecaudacionAnualPage />, { ruta: "/estadisticas/recaudaciones-mensual" });

    expect(await screen.findByRole("button", { name: "Reintentar" })).toBeInTheDocument();
  });
});

describe("Recaudación del mes", () => {
  it("el calendario empieza en lunes y pone cada día en su columna", async () => {
    servidorMock.use(
      http.get(`${API}/recaudacion/dias`, () =>
        HttpResponse.json({
          ok: true,
          items: [{ dia: "2025-10-01", planes: 10000, productos: 2000, total: 12000 }],
          metodos: [{ metodo: "EFECTIVO", total: 12000 }],
        }),
      ),
    );
    renderizar(<RecaudacionMesPage />, { ruta: "/estadisticas/recaudaciones/2025/10", rutaDelUi: "/estadisticas/recaudaciones/:anio/:mes" });

    const primero = await screen.findByRole("link", { name: `1: ${plata(12000)}` });
    // El 1/10/2025 es miércoles: antes van 2 lugares vacíos (lunes y martes).
    const celdas = within(primero.closest("ol")).getAllByRole("listitem", { hidden: true });
    expect(celdas.indexOf(primero.closest("li"))).toBe(2);
    expect(screen.getByRole("heading", { name: /Por método de pago/ }).closest("section")).toHaveTextContent(`Efectivo${texto(12000)} · 100%`);
  });
});

describe("Recaudación del día", () => {
  it("muestra el cierre por método y separa cobros de planes y ventas, sin la hora engañosa", async () => {
    servidorMock.use(
      http.get(`${API}/recaudacion/detalle-dia`, () =>
        HttpResponse.json({
          ok: true,
          total_dia: 21000,
          total_planes: 18000,
          total_productos: 3000,
          cantidad_cobros: 2,
          items: [
            { gym_fecha_id: 1, monto: 10000, metodo_pago: "EFECTIVO", alumno: "Carla Activa", alumno_documento: "30111222", plan: "Mensual", usuario_cobro: "Ana Admin" },
            { gym_fecha_id: 2, monto: 8000, metodo_pago: "TRANSFERENCIA", alumno: "Diego Vencido", alumno_documento: "30333444", plan: "Mensual", usuario_cobro: "Ana Admin" },
          ],
          ventas: [{ id: 7, producto: "Agua", cantidad: 3, monto: 3000, metodo_pago: "MERCADO PAGO", usuario: "Sergio Staff" }],
          metodos: [
            { metodo: "EFECTIVO", total: 10000 },
            { metodo: "TRANSFERENCIA", total: 8000 },
            { metodo: "MERCADO PAGO", total: 3000 },
          ],
        }),
      ),
    );
    renderizar(<RecaudacionDiaPage />, {
      ruta: "/estadisticas/recaudaciones/2025/10/1/detalle",
      rutaDelUi: "/estadisticas/recaudaciones/:anio/:mes/:dia/detalle",
    });

    expect(await screen.findByRole("heading", { name: /miércoles, 1 de octubre 2025/i })).toBeInTheDocument();
    expect(await screen.findByText(texto(21000))).toBeInTheDocument();
    expect(screen.getByText("2 cobros")).toBeInTheDocument();
    expect(screen.getByText("1 venta")).toBeInTheDocument();
    const cierre = screen.getByRole("heading", { name: "Cierre de caja por método" }).closest("section");
    expect(cierre).toHaveTextContent(`Mercado Pago${texto(3000)}`);
    expect(screen.getAllByText("Carla Activa").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Agua").length).toBeGreaterThan(0);
    expect(screen.queryByText("Hora")).not.toBeInTheDocument();
  });

  it("un día sin movimiento lo dice en cada lista", async () => {
    const usuario = userEvent.setup();
    servidorMock.use(
      http.get(`${API}/recaudacion/detalle-dia`, () =>
        HttpResponse.json({ ok: true, total_dia: 0, total_planes: 0, total_productos: 0, cantidad_cobros: 0, items: [], ventas: [], metodos: [] }),
      ),
    );
    renderizar(<RecaudacionDiaPage />, {
      ruta: "/estadisticas/recaudaciones/2025/10/2/detalle",
      rutaDelUi: "/estadisticas/recaudaciones/:anio/:mes/:dia/detalle",
    });

    expect(await screen.findByText("No hubo cobros de planes este día.")).toBeInTheDocument();
    expect(screen.getByText("No hubo ventas de productos este día.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Día siguiente" })).toBeEnabled();
    await usuario.click(screen.getByRole("link", { name: /Octubre 2025/ }));
  });
});

describe("Con el servidor anterior (sin planes / productos separados)", () => {
  it("el gráfico y los totales igual se ven: el total cuenta como planes", async () => {
    servidorMock.use(
      http.get(`${API}/recaudacion/mensual`, () =>
        HttpResponse.json({ ok: true, items: [{ mes: 3, total: 45000 }] }),
      ),
    );
    renderizar(<RecaudacionAnualPage />, { ruta: "/estadisticas/recaudaciones-mensual?anio=2025", rutaDelUi: "/estadisticas/recaudaciones-mensual" });

    expect(await screen.findByRole("button", { name: `Marzo: ${plata(45000)} (planes ${plata(45000)}, productos ${plata(0)})` })).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });

  it("el detalle del día no se rompe si no vienen ventas ni métodos", async () => {
    servidorMock.use(
      http.get(`${API}/recaudacion/detalle-dia`, () =>
        HttpResponse.json({ ok: true, total_dia: 10000, cantidad_cobros: 1, items: [{ gym_fecha_id: 1, monto: 10000, metodo_pago: "EFECTIVO", alumno: "Carla Activa" }] }),
      ),
    );
    renderizar(<RecaudacionDiaPage />, { ruta: "/estadisticas/recaudaciones/2025/10/1/detalle", rutaDelUi: "/estadisticas/recaudaciones/:anio/:mes/:dia/detalle" });

    expect(await screen.findByText("No hubo ventas de productos este día.")).toBeInTheDocument();
    expect(screen.getAllByText("Carla Activa").length).toBeGreaterThan(0);
  });
});
