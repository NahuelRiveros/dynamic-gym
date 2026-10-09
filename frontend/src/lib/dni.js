/** Solo los números del DNI (hasta 10): así se manda al servidor. */
export const soloNumeros = (texto) => String(texto ?? "").replace(/\D/g, "").slice(0, 10);

/** 30111222 → "30.111.222": como figura en el documento, más fácil de revisar al escribirlo. */
export const conPuntos = (dni) => String(dni ?? "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
