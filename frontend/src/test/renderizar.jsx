import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../auth/auth_context.jsx";

/**
 * Renderiza con los mismos providers que la app (main.jsx), en la ruta indicada.
 * `otrasRutas` ({ "/login": "Pantalla de login" }) sirve para ver a dónde redirige.
 */
export function renderizar(ui, { ruta = "/", rutaDelUi = ruta, otrasRutas = {} } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[ruta]}>
          <Routes>
            <Route path={rutaDelUi.split("?")[0]} element={ui} />
            {Object.entries(otrasRutas).map(([path, texto]) => (
              <Route key={path} path={path} element={<p>{texto}</p>} />
            ))}
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}
