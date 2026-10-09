import { Link } from "react-router-dom";
import { ArrowRight, Clock, Instagram, MapPin } from "lucide-react";
import { images } from "../../assets/index.js";
import { GIMNASIO } from "../../config/gimnasio.js";
import { GALERIA, MOTIVOS } from "./datos_gimnasio.js";

const BOTON_PRINCIPAL =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-7 py-4 text-sm font-bold tracking-wider text-white uppercase shadow-lg shadow-sky-500/30 transition outline-none hover:bg-sky-400 focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060a12]";
const BOTON_SECUNDARIO =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-7 py-4 text-sm font-bold tracking-wider text-white uppercase backdrop-blur-sm transition outline-none hover:border-white/30 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-sky-300";
const externo = { target: "_blank", rel: "noopener noreferrer" };

function Encabezado({ antetitulo, titulo, destacado }) {
  return (
    <div className="mb-12 text-center">
      <p className="text-[11px] font-bold tracking-[0.3em] text-sky-400 uppercase">{antetitulo}</p>
      <h2 className="dg-display mt-3 text-5xl leading-none font-black uppercase md:text-6xl">
        {titulo}
        <span className="block text-sky-400">{destacado}</span>
      </h2>
    </div>
  );
}

/** Página pública del gimnasio: para quien todavía no entrena acá (y un atajo para los alumnos). */
export default function LandingPublica() {
  return (
    <div className="dg-body-font overflow-x-hidden bg-[#060a12] text-white">
      <section className="relative flex min-h-[calc(100svh-4rem)] items-center justify-center overflow-hidden px-6 py-20">
        <img src={images.principal} alt="" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
        <div aria-hidden="true" className="absolute inset-0 bg-linear-to-b from-[#060a12]/75 via-[#060a12]/55 to-[#060a12]" />

        <div className="relative mx-auto max-w-4xl text-center">
          <p className="dg-a1 inline-flex items-center gap-2.5 rounded-full border border-sky-500/35 bg-sky-500/10 px-5 py-2 text-xs font-semibold tracking-[0.22em] text-sky-400 uppercase backdrop-blur-sm">
            Dynamic Gym · Formosa Capital
          </p>
          <h1 className="dg-display dg-a2 mt-8 text-[3.35rem] leading-[0.86] font-black tracking-tight uppercase sm:text-7xl md:text-[7.5rem]">
            Rompé
            <span className="dg-shimmer-text block">tus límites</span>
          </h1>
          <p className="dg-a3 mx-auto mt-7 max-w-md text-base leading-relaxed text-slate-300">
            Profesores certificados, equipamiento moderno y una comunidad que te impulsa a dar el 100&nbsp;% cada día.
          </p>
          <div className="dg-a4 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={GIMNASIO.mapa} {...externo} className={BOTON_PRINCIPAL}>
              <MapPin aria-hidden="true" className="h-4 w-4" />
              Cómo llegar
            </a>
            <a href="#gimnasio" className={BOTON_SECUNDARIO}>
              Conocé el gym
            </a>
          </div>
          <Link to="/consulta-plan" className="dg-a4 mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white">
            ¿Ya entrenás con nosotros? <span className="font-semibold text-sky-400">Consultá tu plan</span>
            <ArrowRight aria-hidden="true" className="h-4 w-4 text-sky-400" />
          </Link>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <Encabezado antetitulo="¿Por qué elegirnos?" titulo="Entrenamiento" destacado="de élite" />
          <ul className="grid gap-5 md:grid-cols-3">
            {MOTIVOS.map(({ icono: Icono, titulo, texto, imagen }) => (
              <li key={titulo} className="relative h-96 overflow-hidden rounded-3xl border border-white/10">
                <img src={imagen} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-[#060a12] via-[#060a12]/75 to-[#060a12]/10" />
                <div className="absolute inset-0 flex flex-col justify-end p-7">
                  <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-400">
                    <Icono aria-hidden="true" className="h-6 w-6" />
                  </span>
                  <h3 className="dg-display text-3xl leading-none font-black uppercase">{titulo}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="gimnasio" className="scroll-mt-16 bg-[#0b0f18] px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <Encabezado antetitulo="Nuestro espacio" titulo="Conocé el" destacado="gym" />
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {GALERIA.map(({ imagen, texto }) => (
              <li key={texto}>
                <figure className="relative aspect-3/4 overflow-hidden rounded-2xl border border-white/10">
                  <img src={imagen} alt={texto} loading="lazy" className="h-full w-full object-cover" />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-linear-to-t from-[#060a12]/90 to-transparent px-3 pt-8 pb-3 text-xs font-semibold text-white sm:text-sm">
                    {texto}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="visitanos" className="scroll-mt-16 px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <Encabezado antetitulo="Te esperamos" titulo="Vení a" destacado="entrenar" />
          <div className="grid gap-5 md:grid-cols-2">
            <div className="flex flex-col rounded-3xl border border-white/10 bg-white/3 p-7">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-400">
                <MapPin aria-hidden="true" className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-lg font-bold">Dónde estamos</h3>
              <p className="mt-1 text-slate-400">{GIMNASIO.direccion}</p>
              <a href={GIMNASIO.mapa} {...externo} className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-400 hover:text-sky-300">
                Abrir en Google Maps <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </a>
            </div>

            <div className="flex flex-col rounded-3xl border border-white/10 bg-white/3 p-7">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-500/15 text-pink-400">
                {GIMNASIO.horarios.length ? <Clock aria-hidden="true" className="h-6 w-6" /> : <Instagram aria-hidden="true" className="h-6 w-6" />}
              </span>
              {GIMNASIO.horarios.length ? (
                <>
                  <h3 className="mt-5 text-lg font-bold">Horarios</h3>
                  <dl className="mt-2 space-y-1 text-slate-400">
                    {GIMNASIO.horarios.map(({ dias, horas }) => (
                      <div key={dias} className="flex justify-between gap-4">
                        <dt>{dias}</dt>
                        <dd className="font-semibold text-white">{horas}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              ) : (
                <>
                  <h3 className="mt-5 text-lg font-bold">Escribinos</h3>
                  <p className="mt-1 text-slate-400">Consultanos por planes y horarios en Instagram.</p>
                </>
              )}
              <a href={GIMNASIO.instagram} {...externo} className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-pink-400 hover:text-pink-300">
                {GIMNASIO.usuarioInstagram} <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-white/10 px-6 py-24 text-center">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_100%,rgba(14,165,233,0.12),transparent)]" />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="dg-display text-6xl leading-none font-black uppercase md:text-7xl">
            Tu mejor <span className="block text-sky-400">versión</span> te espera
          </h2>
          <p className="mt-5 text-slate-400">Comenzá hoy. Sin excusas.</p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={GIMNASIO.mapa} {...externo} className={BOTON_PRINCIPAL}>
              <MapPin aria-hidden="true" className="h-4 w-4" />
              Cómo llegar
            </a>
            <a href={GIMNASIO.instagram} {...externo} className={BOTON_SECUNDARIO}>
              <Instagram aria-hidden="true" className="h-4 w-4" />
              Seguinos
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
