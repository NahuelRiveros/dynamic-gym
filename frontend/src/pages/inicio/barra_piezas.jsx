import { DISCOS } from "./barra_medidas.js";

function DibujoDisco({ n, R, T, rx }) {
  const arco = (x) => `M${x} ${-R}A${rx} ${R} 0 0 1 ${x} ${R}`;
  const cuerpo = `M0 ${-R}H${T}A${rx} ${R} 0 0 1 ${T} ${R}H0Z`;
  const goma = { fill: `var(--disco${n})` };
  return (
    <g id={`dgb-disco${n}`}>
      <path d={cuerpo} style={goma} />
      <path d={cuerpo} fill="url(#dgb-luz-goma)" />
      <path d={arco(T * 0.1)} fill="none" stroke="#000" strokeOpacity=".45" strokeWidth="3" />
      <path d={arco(T * 0.13)} fill="none" stroke="#fff" strokeOpacity=".16" strokeWidth="1.6" />
      <path d={arco(T * 0.87)} fill="none" stroke="#fff" strokeOpacity=".13" strokeWidth="1.6" />
      <path d={`M${T * 0.9} ${-R}H${T}A${rx} ${R} 0 0 1 ${T} ${R}H${T * 0.9}A${rx} ${R} 0 0 0 ${T * 0.9} ${-R}Z`} fill="#000" fillOpacity=".28" />
      <ellipse rx={rx} ry={R} style={goma} />
      <ellipse rx={rx} ry={R} fill="url(#dgb-luz-cara)" />
      <ellipse rx={rx * 0.955} ry={R * 0.965} fill="none" stroke="#fff" strokeOpacity=".2" strokeWidth="1.6" />
      <ellipse rx={rx * 0.8} ry={R * 0.8} fill="#000" fillOpacity=".22" stroke="#000" strokeOpacity=".5" strokeWidth="2" />
      <ellipse rx={rx * 0.46} ry={R * 0.46} fill="#fff" fillOpacity=".05" stroke="#fff" strokeOpacity=".14" strokeWidth="1.4" />
      <ellipse rx={(rx * 52) / R} ry="52" fill="url(#dgb-acero)" stroke="#0b0d10" strokeWidth="1.5" />
      <rect x={-rx - 1} y="-25" width={rx + 1} height="50" fill="url(#dgb-acero)" />
    </g>
  );
}

/** Degradado a partir de [posición, color, opacidad]. */
function Degradado({ id, paradas, horizontal = false }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={horizontal ? 1 : 0} y2={horizontal ? 0 : 1}>
      {paradas.map(([posicion, color, opacidad = 1]) => (
        <stop key={posicion} offset={posicion} stopColor={color} stopOpacity={opacidad} />
      ))}
    </linearGradient>
  );
}

const ACERO = [[0, "#4b545d"], [0.14, "#aeb7bf"], [0.3, "#f3f6f8"], [0.46, "#bcc4cb"], [0.72, "#737d87"], [0.9, "#3f4851"], [1, "#2a3138"]];
const LUZ_GOMA = [[0, "#000", 0.62], [0.07, "#000", 0.3], [0.2, "#fff", 0.2], [0.3, "#fff", 0.1], [0.46, "#fff", 0], [0.75, "#000", 0.3], [1, "#000", 0.72]];
const LUZ_CARA = [[0, "#fff", 0.16], [0.35, "#000", 0.12], [1, "#000", 0.5]];
const CANO = [[0, "#0c0e11"], [0.1, "#3a4149"], [0.2, "#1b1f25"], [0.85, "#14171c"], [1, "#08090b"]];
const COLLARIN = "M0 -42H46A5 42 0 0 1 46 42H0Z";
const MARCAS_TUBO = Array.from({ length: 13 }, (_, i) => `M${250 + i * 13} -25v50`).join("");

/** Dibujos de la barra olímpica (en milímetros reales). Se definen una vez y se repiten con <use>. */
export default function BarraPiezas() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
      <defs>
        <Degradado id="dgb-acero" paradas={ACERO} />
        <Degradado id="dgb-luz-goma" paradas={LUZ_GOMA} />
        <Degradado id="dgb-luz-cara" paradas={LUZ_CARA} />
        <Degradado id="dgb-cano" paradas={CANO} horizontal />
        <pattern id="dgb-moleteado" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <path d="M0 0H6M0 0V6" stroke="#0e1319" strokeOpacity=".62" strokeWidth="2" />
        </pattern>
        <g id="dgb-tubo">
          <path d="M0 -25H440A3.5 25 0 0 1 440 25H0Z" fill="url(#dgb-acero)" />
          <path d="M431 -25A3.5 25 0 0 1 431 25" fill="none" stroke="#20262c" strokeOpacity=".6" strokeWidth="2" />
          <path d={MARCAS_TUBO} stroke="#20262c" strokeOpacity=".17" strokeWidth="1.6" />
        </g>
        <g id="dgb-hombro">
          <path d="M-30 -38H0A4.5 38 0 0 1 0 38H-30A4.5 38 0 0 1 -30 -38Z" fill="url(#dgb-acero)" stroke="#2a3138" strokeWidth="1" />
          <path d="M-9 -38A4.5 38 0 0 1 -9 38M-22 -38A4.5 38 0 0 1 -22 38" fill="none" stroke="#1a2026" strokeOpacity=".55" strokeWidth="2" />
        </g>
        <g id="dgb-collarin">
          <path d="M12 -40L20 -78Q21 -84 27 -84H44Q51 -84 49 -77L38 -40Z" fill="#15181d" />
          <path d={COLLARIN} style={{ fill: "var(--collarin)" }} />
          <path d={COLLARIN} fill="url(#dgb-luz-goma)" />
          <path d="M24 -42A5 42 0 0 1 24 42" fill="none" stroke="#000" strokeOpacity=".5" strokeWidth="3" />
          <ellipse rx="5" ry="42" style={{ fill: "var(--collarin)" }} />
          <rect x="-6" y="-25" width="6" height="50" fill="url(#dgb-acero)" />
          <circle cx="36" cy="-4" r="6" fill="#d7dde2" stroke="#20262c" strokeWidth="1.5" />
        </g>
        {DISCOS.map((disco) => (
          <DibujoDisco key={disco.n} {...disco} />
        ))}
      </defs>
    </svg>
  );
}
