import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { servidorMock } from "./servidor_mock.js";

// jsdom no implementa <dialog>.showModal(): versión mínima para los tests de components/ui/modal.jsx.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
}

// Cualquier llamada HTTP no simulada hace fallar el test (así nunca se pega al API real).
beforeAll(() => servidorMock.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  cleanup();
  servidorMock.resetHandlers();
  localStorage.clear();
});
afterAll(() => servidorMock.close());
