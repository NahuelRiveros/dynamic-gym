import { useRef, useEffect } from "react";
import {
  MapPin, Phone, Dumbbell, Users, Instagram,
  ArrowRight, Flame, Trophy,
} from "lucide-react";
import Carousel from "./ui/carrousel.jsx";
import { images } from "../assets/index.js";

const slides = [
  {
    kicker: "Contacto",
    icon: <Phone size={16} />,
    title: "Estamos para ayudarte",
    highlight: "para lograr tus objetivos",
    subtitle: "Consultas, horarios y asesoramiento",
    image: images.principal2,
    points: [
      // {
      //   icon: Phone,
      //   label: "WhatsApp",
      //   description: "Respuesta inmediata",
      //   href: "https://wa.me/543705023131",
      //   external: true,
      // },
      {
        icon: MapPin,
        label: "Ver ubicación",
        description: "Av. Dr. Luis Gutnisky 3870, Formosa Capital",
        href: "https://maps.app.goo.gl/Q6khBsqhu5xgsnebA",
        external: true,
      },
      {
        icon: Instagram,
        label: "Instagram",
        description: "DYNAMIC GYM",
        href: "https://www.instagram.com/dynamic.gymm",
        external: true,
      },
    ],
  },
  {
    kicker: "Entrenamiento",
    icon: <Dumbbell size={16} />,
    title: "Planes profesionales",
    highlight: "para cada objetivo",
    image: images.maquinas1,
    points: [
      {
        icon: Users,
        label: "Clases guiadas",
        description: "Profesores certificados",
      },
      {
        icon: Dumbbell,
        label: "Fuerza y potencia",
        description: "Equipamiento moderno",
      },
    ],
  },
];

const STATS = [
  { icon: Users,    value: "200+", label: "Miembros activos"    },
  { icon: Dumbbell, value: "100%", label: "Equipos modernos"    },
  { icon: Trophy,   value: "5+",   label: "Años de experiencia" },
  { icon: Flame,    value: "10+",  label: "Entrenamientos/mes"  },
];

const FEATURES = [
  {
    icon: Users,
    title: "Profesores Certificados",
    desc: "Entrenadores con formación profesional para guiarte de forma personalizada hacia tus objetivos.",
    image: images.maquinas1,
    iconCls: "text-sky-400 bg-sky-500/15 group-hover:bg-sky-500/30",
    glowCls: "group-hover:shadow-sky-500/20",
    barCls: "bg-sky-500",
  },
  {
    icon: Dumbbell,
    title: "Equipamiento Moderno",
    desc: "Máquinas de última generación y pesos libres para trabajar cada grupo muscular con precisión.",
    image: images.maquinas2,
    iconCls: "text-amber-400 bg-amber-500/15 group-hover:bg-amber-500/30",
    glowCls: "group-hover:shadow-amber-500/20",
    barCls: "bg-amber-500",
  },
  {
    icon: Flame,
    title: "Comunidad Motivadora",
    desc: "Un ambiente de energía donde cada miembro se convierte en tu fuente de inspiración diaria.",
    image: images.maquinas3,
    iconCls: "text-rose-400 bg-rose-500/15 group-hover:bg-rose-500/30",
    glowCls: "group-hover:shadow-rose-500/20",
    barCls: "bg-rose-500",
  },
];

const CONTACTS = [
  // {
  //   icon: Phone,
  //   label: "WhatsApp",
  //   desc: "Respuesta inmediata",
  //   sub: "+54 370 502-3131",
  //   href: "https://wa.me/543705023131",
  //   iconCls: "text-emerald-400 bg-emerald-500/10 group-hover:bg-emerald-500/25",
  //   hoverBorder: "hover:border-emerald-500/50",
  //   accentCls: "text-emerald-400",
  //   glowCls: "hover:shadow-emerald-500/10",
  // },
  {
    icon: MapPin,
    label: "Ubicación",
    desc: "Cómo llegar",
    sub: "Av. Dr. Luis Gutnisky 3870, Formosa Capital",
    href: "https://maps.app.goo.gl/Q6khBsqhu5xgsnebA",
    iconCls: "text-sky-400 bg-sky-500/10 group-hover:bg-sky-500/25",
    hoverBorder: "hover:border-sky-500/50",
    accentCls: "text-sky-400",
    glowCls: "hover:shadow-sky-500/10",
  },
  {
    icon: Instagram,
    label: "Instagram",
    desc: "Seguinos",
    sub: "@dynamic.gymm",
    href: "https://www.instagram.com/dynamic.gymm",
    iconCls: "text-pink-400 bg-pink-500/10 group-hover:bg-pink-500/25",
    hoverBorder: "hover:border-pink-500/50",
    accentCls: "text-pink-400",
    glowCls: "hover:shadow-pink-500/10",
  },
];

export default function HomePage() {
  // ── Parallax sin re-render ─────────────────────────────────────────────────
  // En vez de setState (que re-renderiza todo el componente en cada scroll),
  // mutamos directamente el estilo del elemento via ref.
  const parallaxRef = useRef(null);

  useEffect(() => {
    const el = parallaxRef.current;
    if (!el) return;

    const onScroll = () => {
      el.style.transform = `translateY(${window.scrollY * 0.25}px)`;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="dg-body-font min-h-screen bg-[#060a12] text-white overflow-x-hidden">

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="dg-grain relative flex h-screen min-h-[640px] items-center justify-center overflow-hidden">

        {/* Background parallax — controlado por ref, sin setState */}
        <div ref={parallaxRef} className="absolute inset-0">
          <img
            src={images.principal}
            alt="Dynamic Gym"
            fetchPriority="high"
            className="h-full w-full object-cover scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#060a12]/70 via-[#060a12]/45 to-[#060a12]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#060a12]/55 via-transparent to-[#060a12]/55" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,_transparent,_rgba(6,10,18,0.5))]" />
        </div>

        {/* Top accent line */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500 to-transparent opacity-80" />

        {/* Diagonal decorative line */}
        <div
          className="absolute bottom-0 left-0 w-1/2 h-[1px] bg-gradient-to-r from-sky-500/30 to-transparent"
          style={{ transform: "rotate(-1.5deg) translateY(-60px)" }}
        />

        {/* Content */}
        <div className="relative z-10 px-6 text-center max-w-5xl mx-auto">
          <div className="dg-a1 inline-flex items-center gap-2.5 rounded-full border border-sky-500/35 bg-sky-500/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-400 mb-10 backdrop-blur-sm">
            <span className="dg-blink h-1.5 w-1.5 rounded-full bg-sky-400" />
            Dynamic Gym · Formosa Capital
          </div>

          <h1 className="dg-display dg-a2 text-[3.35rem] sm:text-7xl md:text-[8rem] lg:text-[9.5rem] font-black uppercase leading-[0.86] tracking-tight">
            ROMPE
            <span className="block dg-shimmer-text drop-shadow-[0_0_50px_rgba(14,165,233,0.35)]">
              TUS LÍMITES
            </span>
          </h1>

          <p className="dg-a3 mt-8 max-w-md mx-auto text-base text-gray-400 leading-relaxed">
            Profesores certificados, equipamiento moderno y una comunidad
            que te impulsa a dar el 100&nbsp;% cada día.
          </p>

          <div className="dg-a4 mt-11 flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* <a
              href="https://wa.me/543705023131"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2.5 rounded-2xl bg-sky-500 px-8 py-4 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-sky-500/35 hover:bg-sky-400 hover:scale-105 hover:shadow-sky-400/45 transition-all duration-200"
            >
              Contactar ahora
              <ArrowRight size={15} className="group-hover:translate-x-1.5 transition-transform" />
            </a> */}
            <a
              href="#gimnasio"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-sm font-bold uppercase tracking-wider text-white backdrop-blur-sm hover:bg-white/10 hover:border-white/28 transition-all duration-200"
            >
              Ver el gym
            </a>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-600">
          <span className="text-[10px] uppercase tracking-[0.25em]">Scroll</span>
          <div className="h-9 w-px bg-gradient-to-b from-gray-600 to-transparent animate-pulse" />
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────── */}
      <section className="border-y border-white/6 bg-[#0b0f18] py-14">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="stat-item group">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/15 transition-colors group-hover:bg-sky-500/20 group-hover:ring-sky-500/30">
                  <Icon size={22} />
                </div>
                <div className="dg-display text-4xl font-black text-white">{value}</div>
                <div className="mt-1 text-[11px] uppercase tracking-wider text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES (IMAGE CARDS) ────────────────────────── */}
      <section id="planes" className="py-28 px-6">
        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-18">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-sky-400">
              ¿Por qué elegirnos?
            </span>
            <h2 className="dg-display mt-3 text-5xl md:text-6xl lg:text-7xl font-black uppercase leading-none">
              ENTRENAMIENTO
              <span className="block text-sky-400">DE ÉLITE</span>
            </h2>
            <div className="dg-line-grow mx-auto mt-5 h-[2px] w-16 origin-left bg-gradient-to-r from-sky-500 to-sky-400" />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, image, iconCls, glowCls, barCls }) => (
              <div
                key={title}
                className={`dg-img-card group relative rounded-3xl overflow-hidden border border-white/10 shadow-xl ${glowCls} h-[400px]`}
              >
                {/* Lazy: estas imágenes están debajo del fold */}
                <img
                  src={image}
                  alt={title}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#060a12] via-[#060a12]/60 to-[#060a12]/10" />
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[#060a12]/40" />
                <div className={`absolute top-0 inset-x-0 h-[2px] ${barCls} opacity-70`} />
                <div className="absolute inset-0 flex flex-col justify-end p-7">
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 ${iconCls}`}>
                    <Icon size={24} />
                  </div>
                  <h3 className="dg-display text-3xl font-black uppercase leading-none mb-3">
                    {title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-350">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALLERY / CAROUSEL ────────────────────────────── */}
      <section id="gimnasio" className="py-20 px-6 bg-[#0b0f18]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-sky-400">
              Nuestro espacio
            </span>
            <h2 className="dg-display mt-3 text-5xl md:text-6xl lg:text-7xl font-black uppercase leading-none">
              CONOCÉ EL
              <span className="block text-sky-400">GYM</span>
            </h2>
          </div>
          <Carousel slides={slides} autoPlay intervalMs={6500} />
        </div>
      </section>

      {/* ── CONTACT ───────────────────────────────────────── */}
      <section id="contacto" className="py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-sky-400">
              Contacto directo
            </span>
            <h2 className="dg-display mt-3 text-5xl md:text-6xl lg:text-7xl font-black uppercase leading-none">
              HABLEMOS
              <span className="block text-sky-400">HOY</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {CONTACTS.map(({ icon: Icon, label, desc, sub, href, iconCls, hoverBorder, accentCls, glowCls }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`dg-card group flex flex-col gap-4 rounded-3xl border border-white/8 bg-white/[0.03] p-7 shadow-lg transition-all ${hoverBorder} hover:bg-white/[0.06] ${glowCls}`}
              >
                <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 ${iconCls}`}>
                  <Icon size={26} />
                </div>
                <div>
                  <div className="font-bold text-white text-lg leading-none">{label}</div>
                  <div className="text-[11px] text-gray-500 uppercase tracking-wide mt-1">{desc}</div>
                  <div className="mt-2 text-sm text-gray-400">{sub}</div>
                </div>
                <div className={`mt-auto inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${accentCls}`}>
                  Ir <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-white/8 py-28 px-6 text-center">
        <div className="absolute inset-0">
          {/* Lazy: imagen de fondo del footer, no es LCP */}
          <img
            src={images.principal2}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover opacity-10 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#060a12]/90 via-[#060a12]/80 to-[#060a12]" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_100%,_rgba(14,165,233,0.09),_transparent)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/45 to-transparent" />

        <div className="relative max-w-2xl mx-auto">
          <h2 className="dg-display text-6xl md:text-7xl lg:text-8xl font-black uppercase leading-none mb-6">
            TU MEJOR
            <span className="block text-sky-400 drop-shadow-[0_0_35px_rgba(14,165,233,0.40)]">
              VERSIÓN
            </span>
            TE ESPERA
          </h2>
          <p className="text-gray-500 mb-10 text-base tracking-wide">
            Comenzá hoy. Sin excusas.
          </p>
          {/* <a
            href="https://wa.me/543705023131"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-2xl bg-sky-500 px-10 py-4 font-bold uppercase tracking-wider text-white shadow-xl shadow-sky-500/30 hover:bg-sky-400 hover:scale-105 transition-all duration-200"
          >
            <Phone size={18} />
            Empezar ahora
          </a> */}
        </div>
      </section>

    </div>
  );
}
