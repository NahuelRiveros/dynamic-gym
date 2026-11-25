import { Link } from "react-router-dom";
import { APERTURA, momentoArgentina } from "../../config/gimnasio.js";
import EstadoApertura from "./estado_apertura.jsx";

// La barra de cada día va de las 6 a las 24 h.
const DESDE = 6;
const HASTA = 24;
const porcentaje = (horas) => `${(horas / (HASTA - DESDE)) * 100}%`;
const DIAS = [...APERTURA, { dias: [0], texto: "Domingos" }];

/** Horarios en barras a escala (con una marca en la hora actual) y el atajo para los alumnos. */
export default function Horarios() {
  const { dia, hora } = momentoArgentina();

  return (
    <section className="ini-horarios" aria-labelledby="ini-titulo-horarios">
      <div>
        <h2 id="ini-titulo-horarios" className="dg-display">
          Horarios
        </h2>
        <EstadoApertura />
        <dl>
          {DIAS.map(({ dias, texto, desde, hasta }) => (
            <div key={texto} className="ini-dia">
              <dt>{texto}</dt>
              <dd className="dg-display">{hasta ? `${desde} a ${hasta} h` : "Cerrado"}</dd>
              <dd className="ini-pista" aria-hidden="true">
                {hasta && <span className="ini-franja" style={{ left: porcentaje(desde - DESDE), width: porcentaje(hasta - desde) }} />}
                {dias.includes(dia) && hora >= DESDE && <span className="ini-ahora" style={{ left: porcentaje(hora - DESDE) }} />}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="ini-alumnos">
        <h2 className="dg-display">¿Ya entrenás con nosotros?</h2>
        <p>Escribí tu DNI y mirá cuántos días e ingresos te quedan.</p>
        <Link className="ini-boton" to="/consulta-plan">
          Consultá tu plan
        </Link>
      </div>
    </section>
  );
}
