import { Dumbbell, Zap, Activity, Trophy } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      {/* Línea superior decorativa */}
      <div className="h-1 bg-gradient-to-r from-green-500 via-green-400 to-green-600" />

      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">

        {/* BLOQUE 1 – Marca / Mensaje */}
        <div>
          <h3 className="text-2xl font-extrabold tracking-tight">
            Dynamic <span className="text-green-500">Gym</span>
          </h3>

          <p className="mt-4 text-gray-400 max-w-sm">
            Entrenar no es solo moverse.  
            Es construir fuerza, disciplina y constancia todos los días.
          </p>

          <p className="mt-4 text-sm text-gray-500">
            Preparación física orientada a resultados reales y sostenibles.
          </p>
        </div>

        {/* BLOQUE 2 – Por qué entrenar */}
        <div>
          <h4 className="text-lg font-semibold mb-4">
            ¿Por qué entrenar hoy?
          </h4>

          <ul className="space-y-3">
            <FooterItem
              icon={<Zap size={18} />}
              title="Explosividad"
              text="Potenciá velocidad y reacción"
            />
            <FooterItem
              icon={<Dumbbell size={18} />}
              title="Fuerza"
              text="Base sólida para cualquier disciplina"
            />
            <FooterItem
              icon={<Activity size={18} />}
              title="Pliometría"
              text="Energía, coordinación y potencia"
            />
            <FooterItem
              icon={<Trophy size={18} />}
              title="Rendimiento"
              text="Entrená como un atleta"
            />
          </ul>
        </div>

        {/* BLOQUE 3 – Motivación */}
        <div>
          <h4 className="text-lg font-semibold mb-4">
            Mentalidad de alto rendimiento
          </h4>

          <p className="text-gray-400">
            Cada repetición cuenta.  
            Cada entrenamiento suma.
          </p>

          <p className="mt-4 text-gray-400">
            No entrenamos por moda.  
            Entrenamos para ser mejores que ayer.
          </p>

          <div className="mt-6 rounded-2xl bg-green-600/10 border border-green-500/20 p-4">
            <p className="text-green-400 font-semibold">
              🔥 Constancia &gt; Motivación
            </p>
            <p className="text-sm text-gray-300 mt-1">
              El progreso se construye día a día.
            </p>
          </div>
        </div>
      </div>

      {/* BLOQUE FINAL – Créditos */}
      <div className="border-t border-white/10 py-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Dynamic Gym · Todos los derechos reservados.
        <br />
        <span className="text-gray-600">
          Sistema desarrollado por el equipo de desarrollo.
        </span>
      </div>
    </footer>
  );
}

/* ---------- Subcomponente ---------- */

function FooterItem({ icon, title, text }) {
  return (
    <li className="flex items-start gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600/20 text-green-400">
        {icon}
      </div>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-gray-400">{text}</div>
      </div>
    </li>
  );
}
