import { Dumbbell, Target, Users } from "lucide-react";
import { images } from "../../assets/index.js";

const PUNTOS = [
  { icono: Dumbbell, texto: "Equipamiento moderno para cada entrenamiento" },
  { icono: Target, texto: "Profesores que te acompañan hasta lograr tu objetivo" },
  { icono: Users, texto: "Una comunidad que te impulsa todos los días" },
];

/** Mitad izquierda del login en pantallas grandes: foto del gimnasio y lo que lo hace distinto. */
export default function PanelMarcaLogin() {
  return (
    <div className="relative hidden overflow-hidden lg:block">
      <img src={images.principal} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div aria-hidden="true" className="absolute inset-0 bg-linear-to-br from-slate-950/95 via-slate-950/85 to-sky-950/80" />

      <div className="relative flex h-full flex-col justify-center p-12 xl:p-16">
        <div className="max-w-md">
          <p className="text-sm font-semibold tracking-[0.2em] text-sky-400 uppercase">Dynamic Gym · Formosa Capital</p>
          <p className="mt-4 text-4xl leading-tight font-extrabold text-white xl:text-5xl">
            El mejor lugar para entrenar y lograr tus objetivos.
          </p>
          <ul className="mt-8 space-y-4">
            {PUNTOS.map(({ icono: Icono, texto }) => (
              <li key={texto} className="flex items-center gap-3 text-slate-200">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
                  <Icono aria-hidden="true" className="h-5 w-5 text-sky-300" />
                </span>
                {texto}
              </li>
            ))}
          </ul>
          <p className="mt-10 text-lg font-semibold text-sky-300">Rompé tus límites.</p>
        </div>
      </div>
    </div>
  );
}
