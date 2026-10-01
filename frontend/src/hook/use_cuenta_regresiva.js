import { useEffect, useEffectEvent, useState } from "react";

/**
 * Cuenta regresiva de `segundos` (para los carteles que se cierran solos: kiosco, pago, alta).
 * Devuelve los segundos que faltan y llama a `alTerminar` al llegar a 0. La cuenta arranca al
 * montarse el componente: para reiniciarla, el cartel se vuelve a montar (se abre de nuevo).
 */
export function useCuentaRegresiva({ segundos, alTerminar }) {
  const [restante, setRestante] = useState(segundos);
  // Siempre la última versión de alTerminar, sin reiniciar la cuenta si el padre la recrea.
  const terminar = useEffectEvent(() => alTerminar?.());

  useEffect(() => {
    let seg = segundos;
    const id = setInterval(() => {
      seg -= 1;
      if (seg <= 0) {
        clearInterval(id);
        terminar();
      } else {
        setRestante(seg);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [segundos]);

  return restante;
}
