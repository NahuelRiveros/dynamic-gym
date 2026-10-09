import { Link } from "react-router-dom";
import { Clock, Instagram, MapPin } from "lucide-react";
import { images } from "../../assets/index.js";
import { GIMNASIO } from "../../config/gimnasio.js";

const LINKS = [
  { label: "Inicio", to: "/" },
  { label: "Consultá tu plan", to: "/consulta-plan" },
  { label: "Ingresar (personal del gym)", to: "/login" },
];
const externo = { target: "_blank", rel: "noopener noreferrer" };

function Titulo({ children }) {
  return <h2 className="mb-4 text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">{children}</h2>;
}

/** Footer de la parte pública: quiénes somos, cómo encontrarnos y a dónde ir. */
export default function Footer() {
  return (
    <footer className="dg-body-font border-t border-white/10 bg-[#060a12] text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link to="/" className="inline-flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
            <img src={images.dynamicLogo} alt="" className="h-11 w-11 rounded-xl object-cover" />
            <span className="dg-display text-3xl font-black tracking-tight uppercase">
              Dynamic <span className="text-sky-400">Gym</span>
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
            El mejor lugar para entrenar y lograr tus objetivos. Rompé tus límites.
          </p>
          <a
            href={GIMNASIO.instagram}
            {...externo}
            aria-label={`Instagram de Dynamic Gym (${GIMNASIO.usuarioInstagram})`}
            className="mt-5 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition outline-none hover:border-pink-400/40 hover:text-pink-400 focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <Instagram aria-hidden="true" className="h-5 w-5" />
          </a>
        </div>

        <div>
          <Titulo>Visitanos</Titulo>
          <ul className="space-y-4 text-sm">
            <li>
              <a href={GIMNASIO.mapa} {...externo} className="group flex gap-3 text-slate-300 hover:text-white">
                <MapPin aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
                <span>
                  {GIMNASIO.direccion}
                  <span className="mt-0.5 block text-xs font-semibold text-sky-400 group-hover:underline">Cómo llegar</span>
                </span>
              </a>
            </li>
            <li className="flex gap-3 text-slate-300">
              <Clock aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
              {GIMNASIO.horarios.length ? (
                <dl className="space-y-0.5">
                  {GIMNASIO.horarios.map(({ dias, horas }) => (
                    <div key={dias}>
                      <dt className="inline">{dias}: </dt>
                      <dd className="inline font-semibold text-white">{horas}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <span>Consultá los horarios por Instagram.</span>
              )}
            </li>
          </ul>
        </div>

        <nav aria-label="Enlaces del sitio">
          <Titulo>Accesos</Titulo>
          <ul className="space-y-2.5 text-sm">
            {LINKS.map(({ label, to }) => (
              <li key={to}>
                <Link to={to} className="text-slate-300 transition hover:text-sky-400">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-6 py-5 text-xs text-slate-500 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Dynamic Gym · Formosa Capital</p>
          <p>Sistema de gestión por Riveros Edgardo Nahuel</p>
        </div>
      </div>
    </footer>
  );
}
