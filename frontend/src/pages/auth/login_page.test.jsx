import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { renderizar } from "../test/renderizar.jsx";
import { API, servidorMock } from "../test/servidor_mock.js";
import LoginPage from "./login_page.jsx";

async function completarLogin({ email = "admin@gym.com", password = "clave-123" } = {}) {
  const usuario = userEvent.setup();
  await usuario.type(screen.getByLabelText("Email"), email);
  await usuario.type(screen.getByLabelText("Contraseña"), password);
  await usuario.click(screen.getByRole("button", { name: "Login" }));
}

describe("Login", () => {
  it("con datos correctos da la bienvenida con el nombre de la persona", async () => {
    servidorMock.use(
      http.post(`${API}/auth/login`, () => HttpResponse.json({ ok: true, token: "token-nuevo" })),
      http.get(`${API}/auth/me`, () => HttpResponse.json({ ok: true, usuario: { nombre: "Ana", apellido: "Gómez", roles: ["admin"] } })),
    );
    renderizar(<LoginPage />, { ruta: "/login" });

    await completarLogin();

    expect(await screen.findByText("¡Bienvenido al sistema!")).toBeInTheDocument();
    expect(screen.getByText("Ana Gómez")).toBeInTheDocument();
    expect(localStorage.getItem("token")).toBe("token-nuevo");
  });

  it("con datos incorrectos muestra el mensaje del servidor", async () => {
    servidorMock.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json({ ok: false, codigo: "CREDENCIALES_INVALIDAS", mensaje: "Email o contraseña incorrectos" }, { status: 401 }),
      ),
    );
    renderizar(<LoginPage />, { ruta: "/login" });

    await completarLogin({ password: "otra-clave" });

    expect(await screen.findByText("Email o contraseña incorrectos")).toBeInTheDocument();
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("no manda nada si falta el email", async () => {
    renderizar(<LoginPage />, { ruta: "/login" });
    const usuario = userEvent.setup();

    await usuario.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("El email es obligatorio")).toBeInTheDocument();
  });
});
