import { useRef } from "react";
import { images } from "../../assets/index.js";
import { useAlScrollear } from "../../hook/use_al_scrollear.js";
import { poner, suave, tramo } from "./escenas.js";

/** La frase del vidrio de la entrada y la foto del salón, que se abre al bajar. */
export default function Salon({ animado }) {
  const fotoRef = useRef(null);

  useAlScrollear(() => {
    const foto = fotoRef.current;
    const alto = window.innerHeight;
    poner(foto, "--abre", suave(tramo(alto - foto.getBoundingClientRect().top, alto * 0.05, alto * 0.7)));
  }, animado);

  return (
    <section className="ini-salon" aria-labelledby="ini-titulo-salon">
      <h2 id="ini-titulo-salon" className="dg-display">
        <span>Tu único límite </span>
        <span className="ini-destacado">sos vos.</span>
      </h2>
      <figure ref={fotoRef} className="ini-salon-foto">
        <img
          src={images.principal}
          width="1600"
          height="1200"
          alt="Vista desde arriba de todo el salón: hileras de máquinas, bancos, mancuernas y la puerta al fondo"
          loading="lazy"
        />
      </figure>
    </section>
  );
}
