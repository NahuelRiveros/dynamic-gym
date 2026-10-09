const ZONA_AR = "America/Argentina/Buenos_Aires";

/** "Buen día" / "Buenas tardes" / "Buenas noches" según la hora en Argentina (el servidor puede estar en otra zona). */
export function saludoSegunHora(fecha = new Date()) {
  const hora = Number(fecha.toLocaleString("en-US", { hour: "numeric", hourCycle: "h23", timeZone: ZONA_AR }));
  if (hora >= 5 && hora < 13) return "Buen día";
  if (hora >= 13 && hora < 20) return "Buenas tardes";
  return "Buenas noches";
}

/** "jueves, 9 de octubre" en hora argentina. */
export function fechaDeHoy(fecha = new Date()) {
  return fecha.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: ZONA_AR });
}
