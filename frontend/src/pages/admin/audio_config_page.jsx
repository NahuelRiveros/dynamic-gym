import { useEffect, useRef, useState } from "react";
import { Volume2, PlayCircle } from "lucide-react";
import ordenGymSrc from "../../sounds/OrdenGym.m4a";
import {
  AUDIO_GAIN_OPCIONES,
  getGananciaAudio,
  setGananciaAudio,
} from "../../config/audio_config";

export default function AudioConfigPage() {
  const [ganancia, setGanancia] = useState(getGananciaAudio());

  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const gainRef = useRef(null);

  function getAudioContext() {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    return audioCtxRef.current;
  }

  function conectarGanancia() {
    if (!audioRef.current || gainRef.current) return;
    const ctx = getAudioContext();
    const source = ctx.createMediaElementSource(audioRef.current);
    const gainNode = ctx.createGain();
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    gainRef.current = gainNode;
  }

  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = ganancia;
  }, [ganancia]);

  function elegirGanancia(valor) {
    setGanancia(valor);
    setGananciaAudio(valor);
  }

  async function probarSonido() {
    try {
      conectarGanancia();
      if (gainRef.current) gainRef.current.gain.value = ganancia;
      if (audioCtxRef.current?.state === "suspended") {
        await audioCtxRef.current.resume();
      }
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch (error) {
      console.warn("No se pudo reproducir el audio de prueba:", error?.message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-xl space-y-4">

        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm shadow-blue-500/10">
          <div className="h-1 w-full bg-linear-to-r from-blue-600 via-blue-500 to-cyan-400" />
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-sm shadow-blue-500/25">
              <Volume2 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900">Volumen de avisos</h1>
              <p className="text-xs text-slate-400">Aviso sonoro automático del gimnasio</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <p className="text-sm text-slate-600">
            Elegí con qué ganancia se reproduce el aviso sonoro que suena cada
            25 minutos durante el horario del gym. El cambio se guarda en este
            dispositivo y se aplica al instante.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {AUDIO_GAIN_OPCIONES.map((opcion) => {
              const activo = ganancia === opcion.valor;
              return (
                <button
                  key={opcion.valor}
                  onClick={() => elegirGanancia(opcion.valor)}
                  className={`rounded-xl border-2 px-4 py-4 text-center transition ${
                    activo
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className={`block text-2xl font-extrabold ${activo ? "text-blue-700" : "text-slate-500"}`}>
                    {opcion.label}
                  </span>
                  <span className="block text-xs font-medium text-slate-400 mt-1">
                    {opcion.detalle}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={probarSonido}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-5 py-3 font-bold text-white hover:bg-slate-900 transition"
          >
            <PlayCircle size={18} />
            Probar sonido
          </button>

          <audio ref={audioRef} src={ordenGymSrc} preload="auto" className="hidden" />
        </div>
      </div>
    </div>
  );
}
