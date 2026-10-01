import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "../auth/auth_context.jsx";
import PagoSuccessModal from "../components/modal/pago_success_modal.jsx";
import { API, servidorMock, sesionComo } from "../test/servidor_mock.js";
import { useCuentaRegresiva } from "./use_cuenta_regresiva.js";
import { useFiltros } from "./use_filtros.js";

afterEach(() => vi.useRealTimers());

describe("useCuentaRegresiva", () => {
  it("baja de a un segundo y avisa al llegar a 0 (con la última versión del aviso)", () => {
    vi.useFakeTimers();
    const primero = vi.fn();
    const ultimo = vi.fn();
    const { result, rerender } = renderHook(({ alTerminar }) => useCuentaRegresiva({ segundos: 3, alTerminar }), {
      initialProps: { alTerminar: primero },
    });

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toBe(2);
    rerender({ alTerminar: ultimo }); // el padre la recrea: no reinicia la cuenta
    act(() => vi.advanceTimersByTime(2000));

    expect(ultimo).toHaveBeenCalledTimes(1);
    expect(primero).not.toHaveBeenCalled();
  });

  it("el cartel de pago exitoso arranca la cuenta de cero cada vez que se abre", () => {
    vi.useFakeTimers();
    const props = { alumno: { nombre: "Ana" }, plan: {}, pago: {}, delayMs: 6000, onFinish: vi.fn() };
    const { rerender } = render(<PagoSuccessModal open {...props} />);

    act(() => vi.advanceTimersByTime(4000));
    expect(screen.getByText(/2\s*s/)).toBeInTheDocument();

    rerender(<PagoSuccessModal open={false} {...props} />);
    rerender(<PagoSuccessModal open {...props} />);
    expect(screen.getByText(/6\s*s/)).toBeInTheDocument();
  });
});

describe("useFiltros", () => {
  it("avisa si los filtros no cambiaron (para volver a pedir los mismos datos)", () => {
    const { result } = renderHook(() => useFiltros({ desde: "2026-01-01" }));

    let cambio;
    act(() => { cambio = result.current[1]({ desde: "2026-01-01" }); });
    expect(cambio).toBe(false);
    act(() => { cambio = result.current[1]({ desde: "2026-02-01" }); });
    expect(cambio).toBe(true);
    expect(result.current[0]).toEqual({ desde: "2026-02-01" });
  });
});

describe("Sesión", () => {
  function Sesion() {
    const { usuario, cargando, logout } = useAuth();
    if (cargando) return <p>Verificando…</p>;
    return (
      <>
        <p>{usuario ? `Hola ${usuario.nombre}` : "Sin sesión"}</p>
        <button type="button" onClick={logout}>Salir</button>
      </>
    );
  }

  const conProviders = (queryClient) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Sesion />
      </AuthProvider>
    </QueryClientProvider>
  );

  it("sin token no consulta /me; con token trae el usuario", async () => {
    render(conProviders(new QueryClient()));
    expect(screen.getByText("Sin sesión")).toBeInTheDocument();

    sesionComo({ nombre: "Ana" });
    render(conProviders(new QueryClient()));
    expect(await screen.findByText("Hola Ana")).toBeInTheDocument();
  });

  it("al salir borra el token y todo lo que quedó en caché (puede usar la PC otra persona)", async () => {
    sesionComo({ nombre: "Ana" });
    servidorMock.use(http.post(`${API}/auth/logout`, () => HttpResponse.json({ ok: true })));
    const queryClient = new QueryClient();
    queryClient.setQueryData(["alumnos", "listado", {}], { items: [{ id: 1 }] });
    render(conProviders(queryClient));

    await userEvent.setup().click(await screen.findByRole("button", { name: "Salir" }));

    expect(await screen.findByText("Sin sesión")).toBeInTheDocument();
    expect(localStorage.getItem("token")).toBeNull();
    expect(queryClient.getQueryData(["alumnos", "listado", {}])).toBeUndefined();
  });
});
