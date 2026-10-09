/** "$ 15.000" (pesos, sin centavos). */
export const plata = (valor) =>
  Number(valor || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

/** "$ 1,2 M" para lugares chicos (celdas del calendario, ejes). */
export const plataCorta = (valor) =>
  `$ ${Number(valor || 0).toLocaleString("es-AR", { notation: "compact", maximumFractionDigits: 1 })}`;

// El método de pago se guarda en mayúsculas ("EFECTIVO", "MERCADO PAGO"): así se muestra.
const NOMBRES_METODO = { EFECTIVO: "Efectivo", TRANSFERENCIA: "Transferencia", "MERCADO PAGO": "Mercado Pago", TARJETA: "Tarjeta", DEBITO: "Débito", "SIN DATO": "Sin dato" };
export const nombreMetodo = (metodo) => {
  const clave = String(metodo ?? "").trim().toUpperCase() || "SIN DATO";
  return NOMBRES_METODO[clave] ?? clave.charAt(0) + clave.slice(1).toLowerCase();
};
