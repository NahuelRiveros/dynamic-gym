import { useRef } from "react";
import { GIMNASIO } from "../../config/gimnasio.js";
import { useAlScrollear } from "../../hook/use_al_scrollear.js";
import BarraOlimpica from "./barra_olimpica.jsx";
import { avanceFijo, poner, suave, tramo } from "./escenas.js";

/** La barra cargada se levanta del piso y destapa la invitación a venir. */
export default function Cierre({ animado }) {
  const seccionRef = useRef(null);
  const fijaRef = useRef(null);

  useAlScrollear(() => {
    const seccion = seccionRef.current;
    const q = avanceFijo(seccion, fijaRef.current);
    poner(seccion, "--sube", suave(tramo(q, -0.35, 0.75)));
    // Al despegar del piso la barra se dobla de más y después se acomoda.
    poner(seccion, "--f", 0.15 + 1.15 * suave(tramo(q, -0.5, -0.2)) - 0.3 * suave(tramo(q, 0.5, 0.75)));
  }, animado);

  return (
    <section ref={seccionRef} className="ini-cierre" aria-labelledby="ini-titulo-cierre">
      <div ref={fijaRef} className="ini-cierre-fijo">
        <p className="ini-pared dg-display" aria-hidden="true">
          Dynamic Gym
        </p>
        <div className="ini-cierre-texto">
          <h2 id="ini-titulo-cierre" className="dg-display">
            <span>La próxima </span>
            <span>la levantás vos.</span>
          </h2>
          <p>Te esperamos en {GIMNASIO.direccion}.</p>
        </div>
        <div className="ini-izar">
          <BarraOlimpica />
        </div>
        <div className="ini-suelo">
          <svg viewBox="0 0 1440 180" preserveAspectRatio="none" fill="none" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" stroke="#000" strokeOpacity=".75" strokeWidth="2" d="M-60 180L250 0M330 180L480 0M720 180V0M1110 180L960 0M1500 180L1190 0" />
            <path vectorEffect="non-scaling-stroke" d="M0 1H1440" stroke="#59626c" strokeWidth="2" />
          </svg>
          {/* Los botones van sobre el piso: la barra se levanta desde ahí y nunca los tapa. */}
          <div className="ini-cierre-acciones">
            <a className="ini-boton ini-boton-claro" href={GIMNASIO.mapa} target="_blank" rel="noopener noreferrer">
              Cómo llegar
            </a>
            <a className="ini-boton ini-boton-linea" href={GIMNASIO.instagram} target="_blank" rel="noopener noreferrer">
              {GIMNASIO.usuarioInstagram}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
