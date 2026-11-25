// Horario de apertura: días (0 = domingo … 6 = sábado) y horas en punto, hora argentina.
// Lo usan el sitio web, el footer y el kiosco (que mantiene despierto al servidor solo en este horario).
export const APERTURA = [
  { dias: [1, 2, 3, 4, 5], texto: "Lunes a viernes", desde: 7, hasta: 23 },
  { dias: [6], texto: "Sábados", desde: 9, hasta: 15 },
];

/** Datos de contacto del gimnasio (home y footer). Se cambian acá, no en el diseño. */
export const GIMNASIO = {
  calle: "Av. Dr. Luis Gutnisky 3870",
  ciudad: "Formosa Capital",
  direccion: "Av. Dr. Luis Gutnisky 3870, Formosa Capital",
  mapa: "https://maps.app.goo.gl/Q6khBsqhu5xgsnebA",
  instagram: "https://www.instagram.com/dynamic.gymm",
  usuarioInstagram: "@dynamic.gymm",
  horarios: [
    ...APERTURA.map(({ texto, desde, hasta }) => ({ dias: texto, horas: `${desde} a ${hasta} h` })),
    { dias: "Domingos", horas: "Cerrado" },
  ],
};

/** Día (0 = domingo) y hora con minutos (9.5 = 9:30) en Argentina, aunque el dispositivo esté en otra zona. */
export function momentoArgentina(ahora = new Date()) {
  const partes = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
    timeZone: "America/Argentina/Buenos_Aires",
  }).formatToParts(ahora);
  const valor = (tipo) => partes.find((p) => p.type === tipo).value;
  return {
    dia: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(valor("weekday")),
    hora: Number(valor("hour")) + Number(valor("minute")) / 60,
  };
}

const horarioDelDia = (dia) => APERTURA.find((h) => h.dias.includes(dia));

/** ¿Está abierto en este momento (hora argentina)? */
export function estaAbierto(ahora = new Date()) {
  const { dia, hora } = momentoArgentina(ahora);
  const hoy = horarioDelDia(dia);
  return Boolean(hoy) && hora >= hoy.desde && hora < hoy.hasta;
}

/** Cartel del home: si está abierto y hasta cuándo, o cuándo abre. No contempla feriados. */
export function estadoApertura(ahora = new Date()) {
  const { dia, hora } = momentoArgentina(ahora);
  const hoy = horarioDelDia(dia);
  if (hoy && hora >= hoy.desde && hora < hoy.hasta) return { abierto: true, texto: `Abierto ahora, hasta las ${hoy.hasta} h` };
  if (hoy && hora < hoy.desde) return { abierto: false, texto: `Cerrado, abre hoy a las ${hoy.desde} h` };

  const manana = horarioDelDia((dia + 1) % 7);
  // El único día sin horario es el domingo: si mañana no abre, el próximo es el lunes.
  return {
    abierto: false,
    texto: manana ? `Cerrado, abre mañana a las ${manana.desde} h` : `Cerrado, abre el lunes a las ${horarioDelDia(1).desde} h`,
  };
}
