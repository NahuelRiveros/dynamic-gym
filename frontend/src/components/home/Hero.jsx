import { Dumbbell, Flame, Trophy } from "lucide-react";
import {images} from "../../assets/index.js"
export default function Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-black text-white">
      {/* Fondo */}
      <div className="absolute inset-0 bg-linear-to-br from-black via-zinc-900 to-black" />

      {/* Contenido */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* Texto */}
        <div>
          <span className="inline-block mb-4 rounded-full bg-green-600/20 px-4 py-1 text-sm font-semibold text-green-400">
            Entrenamiento de alto rendimiento
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
            Superá tus límites.
            <br />
            <span className="text-green-500">Entrená como un profesional.</span>
          </h1>

          <p className="mt-6 text-lg text-gray-300 max-w-xl">
            Un espacio diseñado para quienes buscan resultados reales.
            Equipamiento moderno, seguimiento profesional y un ambiente
            enfocado en la mejora constante.
          </p>

          {/* Highlights */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <HeroFeature
              icon={<Dumbbell className="h-6 w-6" />}
              title="Máquinas modernas"
              text="Equipamiento de última generación"
            />
            <HeroFeature
              icon={<Flame className="h-6 w-6" />}
              title="Entrenamiento intenso"
              text="Planes adaptados a tu objetivo"
            />
            <HeroFeature
              icon={<Trophy className="h-6 w-6" />}
              title="Alto rendimiento"
              text="Elegido por deportistas exigentes"
            />
          </div>
        </div>

        {/* Imagen / Visual */}
        <div className="relative h-80 md:h-105 rounded-3xl overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-linear-to-tr from-black/70 via-black/30 to-transparent" />
          <img
            src={images.heroGym4}
            alt="Entrenamiento de alto rendimiento"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}

/* ---------- Subcomponente ---------- */

function HeroFeature({ icon, title, text }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600/20 text-green-400">
        {icon}
      </div>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-gray-400">{text}</div>
      </div>
    </div>
  );
}
