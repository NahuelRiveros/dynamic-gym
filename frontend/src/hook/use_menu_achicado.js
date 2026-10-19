import { useState } from "react";

const CLAVE = "dg_menu_achicado";

function leer() {
  try {
    return localStorage.getItem(CLAVE) === "1";
  } catch {
    return false;
  }
}

/** Si la barra lateral está achicada a solo íconos. Se recuerda en esta compu entre visitas. */
export function useMenuAchicado() {
  const [achicado, setAchicado] = useState(leer);

  function alternar() {
    setAchicado((antes) => {
      try {
        localStorage.setItem(CLAVE, antes ? "0" : "1");
      } catch {
        // Sin almacenamiento (modo privado): igual se achica, solo no se recuerda.
      }
      return !antes;
    });
  }

  return [achicado, alternar];
}
