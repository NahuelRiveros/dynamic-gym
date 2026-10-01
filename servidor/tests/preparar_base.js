import { armarBaseDeTest } from "./armar_base.js";

// Antes de todos los tests del servidor: base local limpia con usuarios de prueba.
export default async function prepararBase() {
  await armarBaseDeTest();
}
