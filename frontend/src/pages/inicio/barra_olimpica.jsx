import { DISCOS } from "./barra_medidas.js";

const CURVATURA = 3.2e-5; // flexión con la barra llena
// Apoyada en ±500 mm: con peso sube en el medio y cae en las puntas.
const altura = (x) => CURVATURA * (x * x - 500 * 500);

// La caña va en tramos rectos que se inclinan con la flexión; `moleteado` = zonas con agarre.
const TRAMOS = [
  { a: 0, b: 131, moleteado: [[0, 60]] },
  { a: 131, b: 262, moleteado: [[205, 262]] },
  { a: 262, b: 393, moleteado: [[262, 393]] },
  { a: 393, b: 524, moleteado: [[393, 452], [458, 524]] },
  { a: 524, b: 655, moleteado: [[524, 640]] },
];

function MediaCana({ lado }) {
  return (
    <g transform={`scale(${lado === "izq" ? -1 : 1} 1)`}>
      {TRAMOS.map(({ a, b, moleteado }) => {
        const angulo = (Math.atan((altura(b) - altura(a)) / (b - a)) * 180) / Math.PI;
        return (
          <g key={a} transform={`translate(${a} 0)`}>
            <g className="dgb-tramo" style={{ "--y": altura(a).toFixed(3), "--g": angulo.toFixed(3) }}>
              <rect x="-.5" y="-14" width={b - a + 1} height="28" fill="url(#dgb-acero)" />
              {moleteado.map(([desde, hasta]) => (
                <rect key={desde} x={desde - a} y="-14" width={hasta - desde} height="28" fill="url(#dgb-moleteado)" />
              ))}
            </g>
          </g>
        );
      })}
    </g>
  );
}

function Disco({ n, T, rx, x, nombre, letra, lado }) {
  // El nombre va centrado en lo que queda a la vista: se descuenta lo que tapa el disco anterior.
  const tapado = n > 1 ? (DISCOS[n - 2].rx - rx) / 2 : 0;
  const espejo = lado === "izq" ? " scale(-1 1)" : "";
  return (
    <svg className={`dgb-pieza dgb-disco dgb-disco-${n}`} viewBox="-30 -230 150 460" style={{ "--x": x }}>
      <use href={`#dgb-disco${n}`} />
      <text className="dgb-rotulo" transform={`translate(${T / 2 + rx * 0.9 + tapado} 0)${espejo} rotate(90)`} fontSize={letra} textAnchor="middle" dy=".345em">
        {nombre}
      </text>
    </svg>
  );
}

function Manga({ lado }) {
  return (
    <div className={`dgb-manga dgb-manga-${lado}`}>
      <svg className="dgb-pieza dgb-tubo" viewBox="-5 -60 470 120"><use href="#dgb-tubo" /></svg>
      <svg className="dgb-pieza dgb-collarin" viewBox="-30 -90 120 180" style={{ "--x": 211 }}><use href="#dgb-collarin" /></svg>
      {/* De la punta hacia el centro: cada disco tapa al que está más afuera. */}
      {[...DISCOS].reverse().map((disco) => (
        <Disco key={disco.n} {...disco} lado={lado} />
      ))}
      <svg className="dgb-pieza dgb-hombro" viewBox="-40 -60 60 120"><use href="#dgb-hombro" /></svg>
    </div>
  );
}

function Parante({ x }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <rect x="-32" y="-48" width="64" height="1400" fill="url(#dgb-cano)" />
      <rect x="-35" y="-56" width="70" height="12" rx="3" fill="#0c0e11" />
      {Array.from({ length: 12 }, (_, i) => (
        <circle key={i} cy={100 + i * 92} r="10" fill="#050608" stroke="#5a626b" strokeWidth="2" />
      ))}
    </g>
  );
}

function Gancho({ x }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <rect x="-42" y="1" width="84" height="41" rx="4" fill="var(--color-cobalto)" />
      <rect x="-42" y="1" width="84" height="5" rx="2.5" fill="#fff" fillOpacity=".35" />
      <rect x="-42" y="30" width="84" height="12" rx="3" fill="#000" fillOpacity=".28" />
      <circle cy="20" r="6" fill="#0b1a78" />
    </g>
  );
}

/**
 * Barra olímpica decorativa (necesita <BarraPiezas /> una vez en la página). `enRack`: apoyada en
 * los soportes. Se mueve con variables CSS: --f = flexión, --d1…--d4 = discos y collarín (0 a 1).
 */
export default function BarraOlimpica({ enRack = false }) {
  return (
    <div className="dgb-mundo" aria-hidden="true">
      {enRack && (
        <svg className="dgb-pieza dgb-rack" viewBox="-540 -90 1080 1400">
          <Parante x={-500} />
          <Parante x={500} />
        </svg>
      )}
      <div className="dgb-barra">
        <svg className="dgb-pieza dgb-cana" viewBox="-660 -40 1320 80">
          <MediaCana lado="izq" />
          <MediaCana lado="der" />
        </svg>
        <Manga lado="izq" />
        <Manga lado="der" />
      </div>
      {enRack && (
        <svg className="dgb-pieza dgb-ganchos" viewBox="-560 -60 1120 120">
          <Gancho x={-500} />
          <Gancho x={500} />
        </svg>
      )}
    </div>
  );
}
