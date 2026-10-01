import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

export const API = "http://localhost:3001/api";

// Cada test declara las respuestas que necesita con servidorMock.use(...).
export const servidorMock = setupServer();

/** Simula una sesión iniciada: token guardado y /auth/me devolviendo ese usuario. */
export function sesionComo({ nombre = "Ana", apellido = "Gómez", roles = ["admin"] } = {}) {
  localStorage.setItem("token", "token-de-prueba");
  servidorMock.use(
    http.get(`${API}/auth/me`, () => HttpResponse.json({ ok: true, usuario: { usuario_id: 1, persona_id: 1, nombre, apellido, roles } })),
  );
}
