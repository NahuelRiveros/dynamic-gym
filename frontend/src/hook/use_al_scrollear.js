import { useEffect, useEffectEvent } from "react";

/** Llama a `pintar` al scrollear o cambiar el tamaño de la ventana o de la página: como mucho una vez por cuadro. */
export function useAlScrollear(pintar, activo = true) {
  const alPintar = useEffectEvent(pintar);

  useEffect(() => {
    if (!activo) return;
    let pedido = 0;
    const cuadro = () => {
      pedido = 0;
      alPintar();
    };
    const pedir = () => {
      pedido ||= requestAnimationFrame(cuadro);
    };
    pedir();
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    // Si aparece algo arriba (la barra del panel al verificarse la sesión) la escena se corre sin que haya scroll.
    const observador = window.ResizeObserver && new ResizeObserver(pedir);
    observador?.observe(document.body);
    return () => {
      cancelAnimationFrame(pedido);
      window.removeEventListener("scroll", pedir);
      window.removeEventListener("resize", pedir);
      observador?.disconnect();
    };
  }, [activo]);
}
