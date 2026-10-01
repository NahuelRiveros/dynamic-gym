import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { servidorMock } from "./servidor_mock.js";

// Cualquier llamada HTTP no simulada hace fallar el test (así nunca se pega al API real).
beforeAll(() => servidorMock.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  cleanup();
  servidorMock.resetHandlers();
  localStorage.clear();
});
afterAll(() => servidorMock.close());
