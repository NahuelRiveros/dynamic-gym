/** Cuentas de las escenas de scroll del sitio público. */

/** Avance (0 a 1) de `v` entre `desde` y `hasta`. */
export const tramo = (v, desde, hasta) => Math.min(1, Math.max(0, (v - desde) / (hasta - desde)));
export const suave = (t) => t * t * (3 - 2 * t);
export const frenar = (t) => 1 - (1 - t) ** 3;

/** Avance de una sección con escena fija: negativo mientras llega y de 0 a 1 mientras está fija. */
export function avanceFijo(seccion, fija) {
  const recorrido = seccion.offsetHeight - fija.offsetHeight;
  if (recorrido <= 0) return 0;
  // El `top` de la escena fija es lo que ocupa la barra de navegación.
  const tope = Number.parseFloat(getComputedStyle(fija).top) || 0;
  return (tope - seccion.getBoundingClientRect().top) / recorrido;
}

/** Escribe una variable CSS solo si cambió: así el navegador no recalcula estilos de más. */
export function poner(elemento, nombre, valor) {
  const texto = valor.toFixed(4);
  if (elemento.style.getPropertyValue(nombre) !== texto) elemento.style.setProperty(nombre, texto);
}
