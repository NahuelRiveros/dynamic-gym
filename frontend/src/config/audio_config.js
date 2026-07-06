// Configuración del aviso sonoro periódico del gym: sonido, volumen y frecuencia.
// Se guarda en localStorage porque es una preferencia por dispositivo
// (el equipo físico que reproduce el sonido en el local), no del usuario logueado.

import ordenGymSrc from "../sounds/OrdenGym.m4a";
import ingresoCorrectoSrc from "../sounds/IngresoCorrecto.m4a";
import ingresoErroneoSrc from "../sounds/IngresoErroneo.m4a";

export const AVISO_CONFIG_STORAGE_KEY = "gym_aviso_config";
export const AVISO_CONFIG_EVENT = "gym-aviso-config-changed";

export const SONIDOS_POR_DEFECTO = [
  { id: "orden_gym", nombre: "Orden del gym (clásico)", src: ordenGymSrc },
  { id: "ingreso_correcto", nombre: "Campana suave", src: ingresoCorrectoSrc },
  { id: "ingreso_erroneo", nombre: "Alerta fuerte", src: ingresoErroneoSrc },
];

export const GANANCIA_OPCIONES = [
  { valor: 1, label: "x1", detalle: "Volumen nativo (100%)" },
  { valor: 2, label: "x2", detalle: "Amplificado (200%)" },
];

export const INTERVALO_MINIMO_MIN = 1;
export const INTERVALO_MAXIMO_MIN = 180;

export const AVISO_CONFIG_DEFAULT = {
  habilitado: true,
  intervaloMinutos: 25,
  ganancia: 2,
  sonidoId: "orden_gym",       // referencia a SONIDOS_POR_DEFECTO, se usa si no hay sonido personalizado
  sonidoCustomNombre: null,
  sonidoCustomDataUrl: null,   // si está seteado, tiene prioridad sobre sonidoId
};

export function getAvisoConfig() {
  try {
    const raw = localStorage.getItem(AVISO_CONFIG_STORAGE_KEY);
    if (!raw) return { ...AVISO_CONFIG_DEFAULT };
    return { ...AVISO_CONFIG_DEFAULT, ...JSON.parse(raw) };
  } catch {
    return { ...AVISO_CONFIG_DEFAULT };
  }
}

export function setAvisoConfig(parcial) {
  const nuevo = { ...getAvisoConfig(), ...parcial };
  localStorage.setItem(AVISO_CONFIG_STORAGE_KEY, JSON.stringify(nuevo));
  window.dispatchEvent(new CustomEvent(AVISO_CONFIG_EVENT, { detail: nuevo }));
  return nuevo;
}

export function getSonidoSrc(config) {
  if (config.sonidoCustomDataUrl) return config.sonidoCustomDataUrl;
  const encontrado = SONIDOS_POR_DEFECTO.find((s) => s.id === config.sonidoId);
  return (encontrado || SONIDOS_POR_DEFECTO[0]).src;
}
