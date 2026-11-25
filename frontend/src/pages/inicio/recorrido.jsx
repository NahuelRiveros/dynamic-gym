import { useRef } from "react";
import { Link } from "react-router-dom";
import { images } from "../../assets/index.js";
import { GIMNASIO } from "../../config/gimnasio.js";
import { useAlScrollear } from "../../hook/use_al_scrollear.js";
import BarraOlimpica from "./barra_olimpica.jsx";
import { MOTIVOS } from "./datos_gimnasio.js";
import { avanceFijo, frenar, poner, suave, tramo } from "./escenas.js";
import EstadoApertura from "./estado_apertura.jsx";

const INICIO = 0.1; // hasta acá se despide la portada
const PASO = 0.3; // lo que dura cada motivo

/** El golpecito de la barra cuando calza un disco. */
function golpe(barra, fuerza) {
  barra.animate?.(
    [{ transform: "none" }, { transform: `translateY(${fuerza}px)` }, { transform: `translateY(${-fuerza * 0.4}px)` }, { transform: "none" }],
    { duration: 300, easing: "ease-out" },
  );
}

/** Portada y motivos en una sola escena fija: al bajar, cada motivo suma un disco a la barra. */
export default function Recorrido({ animado }) {
  const seccionRef = useRef(null);
  const fijaRef = useRef(null);
  const portadaRef = useRef(null);
  const puestosRef = useRef(0);

  useAlScrollear(() => {
    const seccion = seccionRef.current;
    const q = avanceFijo(seccion, fijaRef.current);

    const salida = tramo(q, 0.015, INICIO);
    poner(seccion, "--salida", suave(salida));
    // Con la portada afuera, sus botones no se pueden tocar ni enfocar (estarían invisibles).
    portadaRef.current.toggleAttribute("data-fuera", salida === 1);

    seccion.querySelectorAll(".ini-motivo").forEach((motivo, i) => {
      const inicio = INICIO + i * PASO;
      const ultimo = i === MOTIVOS.length - 1;
      poner(motivo, "--entra", suave(tramo(q, inicio - 0.02, inicio + 0.07)));
      poner(motivo, "--sale", ultimo ? 0 : suave(tramo(q, inicio + PASO - 0.07, inicio + PASO - 0.01)));
      poner(seccion, `--d${i + 1}`, frenar(tramo(q, inicio - 0.05, inicio + 0.13)));
    });
    poner(seccion, "--d4", frenar(tramo(q, 0.86, 0.95)));

    const puestos = MOTIVOS.filter((_, i) => q >= INICIO + i * PASO + 0.11).length;
    if (puestos === puestosRef.current) return;
    if (puestos > puestosRef.current) golpe(seccion.querySelector(".dgb-barra"), 5 - puestos);
    puestosRef.current = puestos;
    poner(seccion, "--f", puestos / MOTIVOS.length);
  }, animado);

  return (
    <section ref={seccionRef} className="ini-recorrido" aria-labelledby="ini-titulo">
      <div ref={fijaRef} className="ini-fija">
        <div ref={portadaRef} className="ini-portada">
          <div className="ini-portada-arriba">
            <h1 id="ini-titulo" className="dg-display">
              <span>Rompé </span>
              <span className="ini-destacado">tus límites</span>
            </h1>
            <figure className="ini-portada-foto">
              <img
                src={images.principal2}
                width="1200"
                height="1600"
                alt="El salón de Dynamic Gym visto desde la entrada: máquinas azules y negras, piso de goma y césped sintético"
                fetchPriority="high"
              />
            </figure>
            <p className="ini-portada-que">Dynamic Gym, tu gimnasio en {GIMNASIO.ciudad}.</p>
            <div className="ini-portada-acciones">
              <a className="ini-boton" href={GIMNASIO.mapa} target="_blank" rel="noopener noreferrer">
                Cómo llegar
              </a>
              <Link className="ini-enlace" to="/consulta-plan">
                Consultá tu plan
              </Link>
              <a className="ini-enlace" href={GIMNASIO.instagram} target="_blank" rel="noopener noreferrer">
                {GIMNASIO.usuarioInstagram}
              </a>
            </div>
          </div>
          <div className="ini-portada-datos">
            <strong>{GIMNASIO.calle}</strong>
            <EstadoApertura />
          </div>
        </div>

        <div className="ini-barra-rack">
          <BarraOlimpica enRack />
        </div>

        <div className="ini-motivos">
          <h2 className="dg-display">Tres motivos para cargar la barra</h2>
          {MOTIVOS.map(({ titulo, texto, imagen, alt }) => (
            <article key={titulo[0]} className="ini-motivo">
              <figure className="ini-motivo-foto">
                <img src={imagen} width="1200" height="1600" alt={alt} />
              </figure>
              <div className="ini-motivo-texto">
                <h3 className="dg-display">
                  <span>{titulo[0]} </span>
                  <span>{titulo[1]}</span>
                </h3>
                <p>{texto}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
