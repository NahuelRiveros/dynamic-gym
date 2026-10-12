// Horario de apertura: días (0 = domingo … 6 = sábado) y horas en punto, hora argentina.
// Lo usan el sitio web, el footer y el kiosco (que mantiene despierto al servidor solo en este horario).
export const APERTURA = [
  { dias: [1, 2, 3, 4, 5], texto: "Lunes a viernes", desde: 7, hasta: 23 },
  { dias: [6], texto: "Sábados", desde: 9, hasta: 15 },
];

/** Datos de contacto del gimnasio (home y footer). Se cambian acá, no en el diseño. */
export const GIMNASIO = {
  direccion: "Av. Dr. Luis Gutnisky 3870, Formosa Capital",
  mapa: "https://maps.app.goo.gl/Q6khBsqhu5xgsnebA",
  instagram: "https://www.instagram.com/dynamic.gymm",
  usuarioInstagram: "@dynamic.gymm",
  horarios: APERTURA.map(({ texto, desde, hasta }) => ({ dias: texto, horas: `${desde} a ${hasta} h` })),
};

/** ¿Está abierto en este momento (hora argentina)? */
export function estaAbierto(ahora = new Date()) {
  const partes = new Intl.DateTimeFormat("en-US", { weekday: "short", hour: "numeric", hourCycle: "h23", timeZone: "America/Argentina/Buenos_Aires" }).formatToParts(ahora);
  const dia = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(partes.find((p) => p.type === "weekday").value);
  const hora = Number(partes.find((p) => p.type === "hour").value);
  return APERTURA.some((h) => h.dias.includes(dia) && hora >= h.desde && hora < h.hasta);
}
