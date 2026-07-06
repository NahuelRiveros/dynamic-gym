// Configuración del volumen de los avisos sonoros del gym.
// Se guarda en localStorage porque es una preferencia por dispositivo
// (el equipo físico que reproduce el sonido en el local), no del usuario logueado.

export const AUDIO_GAIN_STORAGE_KEY = "gym_audio_ganancia";
export const AUDIO_GAIN_EVENT = "gym-audio-ganancia-changed";
export const AUDIO_GAIN_DEFAULT = 2;

export const AUDIO_GAIN_OPCIONES = [
  { valor: 1, label: "x1", detalle: "Volumen nativo (100%)" },
  { valor: 2, label: "x2", detalle: "Amplificado (200%)" },
];

export function getGananciaAudio() {
  const raw = Number(localStorage.getItem(AUDIO_GAIN_STORAGE_KEY));
  const esValida = AUDIO_GAIN_OPCIONES.some((o) => o.valor === raw);
  return esValida ? raw : AUDIO_GAIN_DEFAULT;
}

export function setGananciaAudio(valor) {
  localStorage.setItem(AUDIO_GAIN_STORAGE_KEY, String(valor));
  window.dispatchEvent(new CustomEvent(AUDIO_GAIN_EVENT, { detail: valor }));
}
