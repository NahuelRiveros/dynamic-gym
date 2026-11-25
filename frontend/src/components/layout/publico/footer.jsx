import { Link } from "react-router-dom";
import { GIMNASIO } from "../../../config/gimnasio.js";
import MarcaPublica from "./marca_publica.jsx";

const LINKS = [
  { label: "Inicio", to: "/" },
  { label: "Consultá tu plan", to: "/consulta-plan" },
  { label: "Ingresar (personal del gym)", to: "/login" },
];
const ENLACE = "inline-flex min-h-11 items-center underline underline-offset-4 outline-none hover:text-white focus-visible:ring-3 focus-visible:ring-white";
const externo = { target: "_blank", rel: "noopener noreferrer" };

function Titulo({ children }) {
  return <h2 className="dg-display mb-1.5 text-xl font-bold text-white">{children}</h2>;
}

/** Footer de la parte pública: dónde estamos, cuándo abrimos y a dónde ir. */
export default function Footer() {
  return (
    <footer className="dg-body-font bg-goma px-4 pt-9 pb-7 text-[#d9dfe4] lg:px-[4.4vw] lg:pt-12">
      <div className="grid gap-x-12 gap-y-7 sm:grid-cols-2 lg:grid-cols-[1.4fr_1.2fr_1.2fr_1fr]">
        <div className="text-white">
          <MarcaPublica />
        </div>

        <div>
          <Titulo>Dónde estamos</Titulo>
          <p>
            {GIMNASIO.calle}
            <br />
            {GIMNASIO.ciudad}
          </p>
          <a href={GIMNASIO.mapa} {...externo} className={ENLACE}>
            Cómo llegar
          </a>
        </div>

        <div>
          <Titulo>Horarios</Titulo>
          <dl className="grid max-w-72 grid-cols-[auto_1fr] gap-x-4 gap-y-0.5">
            {GIMNASIO.horarios.map(({ dias, horas }) => (
              <div key={dias} className="contents">
                <dt>{dias}</dt>
                <dd className="tabular-nums">{horas}</dd>
              </div>
            ))}
          </dl>
          <a href={GIMNASIO.instagram} {...externo} aria-label={`Instagram de Dynamic Gym (${GIMNASIO.usuarioInstagram})`} className={ENLACE}>
            Instagram {GIMNASIO.usuarioInstagram}
          </a>
        </div>

        <nav aria-label="Enlaces del sitio">
          <Titulo>Accesos</Titulo>
          <ul>
            {LINKS.map(({ label, to }) => (
              <li key={to}>
                <Link to={to} className={ENLACE}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="mt-8 flex flex-col gap-1 border-t border-[#343a42] pt-4 text-sm text-acero sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} Dynamic Gym · {GIMNASIO.ciudad}</p>
        <p>Sistema de gestión por Riveros Edgardo Nahuel</p>
      </div>
    </footer>
  );
}
