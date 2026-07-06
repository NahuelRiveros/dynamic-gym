import { useEffect, useRef, useState } from "react";
import { Volume2, PlayCircle, Upload, Trash2, RotateCcw } from "lucide-react";
import {
  AVISO_CONFIG_DEFAULT,
  SONIDOS_POR_DEFECTO,
  GANANCIA_MINIMO_PCT,
  GANANCIA_MAXIMO_PCT,
  GANANCIA_PASO_PCT,
  INTERVALO_MINIMO_MIN,
  INTERVALO_MAXIMO_MIN,
  getAvisoConfig,
  setAvisoConfig,
  getSonidoSrc,
} from "../../config/audio_config";

const TAMANO_MAX_BYTES = 3 * 1024 * 1024; // 3 MB: límite prudente para no saturar localStorage

export default function AudioConfigPage() {
  const [config, setConfig] = useState(getAvisoConfig());
  const [error, setError] = useState("");

  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const gainRef = useRef(null);
  const fileInputRef = useRef(null);

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
    if (gainRef.current) gainRef.current.gain.value = config.gananciaPct / 100;
  }, [config.gananciaPct]);

  function actualizar(parcial) {
    setConfig(setAvisoConfig(parcial));
    setError("");
  }

  function elegirSonidoPorDefecto(id) {
    actualizar({ sonidoId: id, sonidoCustomDataUrl: null, sonidoCustomNombre: null });
  }

  function onGananciaChange(event) {
    actualizar({ gananciaPct: Number(event.target.value) });
  }

  function onIntervaloChange(event) {
    const valor = Number(event.target.value);
    if (!Number.isFinite(valor)) return;
    const acotado = Math.min(Math.max(valor, INTERVALO_MINIMO_MIN), INTERVALO_MAXIMO_MIN);
    actualizar({ intervaloMinutos: acotado });
  }

  function onToggleHabilitado() {
    actualizar({ habilitado: !config.habilitado });
  }

  function onSeleccionarArchivo(event) {
    const archivo = event.target.files?.[0];
    event.target.value = "";
    if (!archivo) return;

    if (!archivo.type.startsWith("audio/")) {
      setError("El archivo debe ser de audio (mp3, wav, m4a, etc).");
      return;
    }
    if (archivo.size > TAMANO_MAX_BYTES) {
      setError("El archivo es muy pesado. Usá un audio corto de hasta 3 MB.");
      return;
    }

    const lector = new FileReader();
    lector.onload = () => {
      actualizar({ sonidoCustomDataUrl: lector.result, sonidoCustomNombre: archivo.name });
    };
    lector.onerror = () => setError("No se pudo leer el archivo de audio.");
    lector.readAsDataURL(archivo);
  }

  function quitarSonidoCustom() {
    actualizar({
      sonidoCustomDataUrl: null,
      sonidoCustomNombre: null,
      sonidoId: AVISO_CONFIG_DEFAULT.sonidoId,
    });
  }

  function restaurarValoresOriginales() {
    actualizar({ ...AVISO_CONFIG_DEFAULT });
  }

  async function probarSonido() {
    try {
      conectarGanancia();
      if (gainRef.current) gainRef.current.gain.value = config.gananciaPct / 100;
      if (audioCtxRef.current?.state === "suspended") {
        await audioCtxRef.current.resume();
      }
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch (err) {
      console.warn("No se pudo reproducir el audio de prueba:", err?.message);
      setError("El navegador bloqueó la reproducción. Probá de nuevo.");
    }
  }

  const sonidoActualSrc = getSonidoSrc(config);
  const usandoCustom = Boolean(config.sonidoCustomDataUrl);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-xl space-y-4">

        {/* ── ENCABEZADO ── */}
        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm shadow-blue-500/10">
          <div className="h-1 w-full bg-linear-to-r from-blue-600 via-blue-500 to-cyan-400" />
          <div className="flex items-center justify-between gap-3 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-sm shadow-blue-500/25">
                <Volume2 size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold text-slate-900">Avisos sonoros</h1>
                <p className="text-xs text-slate-400">Sonido, volumen y frecuencia del aviso periódico</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={restaurarValoresOriginales}
                title="Restaurar sonido, volumen y frecuencia originales"
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition"
              >
                <RotateCcw size={12} />
                Restaurar
              </button>
              <button
                onClick={onToggleHabilitado}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  config.habilitado ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {config.habilitado ? "Activado" : "Desactivado"}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ── FRECUENCIA ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-700">Frecuencia</h2>
          <p className="text-xs text-slate-500">
            Cada cuántos minutos suena el aviso mientras el gym está abierto.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={INTERVALO_MINIMO_MIN}
              max={INTERVALO_MAXIMO_MIN}
              value={config.intervaloMinutos}
              onChange={onIntervaloChange}
              className="w-24 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 focus:border-blue-400 focus:outline-none"
            />
            <span className="text-sm text-slate-500">minutos</span>
          </div>
        </div>

        {/* ── SONIDO ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
          <h2 className="text-sm font-bold text-slate-700 mb-1">Sonido</h2>

          {SONIDOS_POR_DEFECTO.map((sonido) => {
            const activo = !usandoCustom && config.sonidoId === sonido.id;
            return (
              <button
                key={sonido.id}
                onClick={() => elegirSonidoPorDefecto(sonido.id)}
                className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left text-sm font-semibold transition ${
                  activo
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {sonido.nombre}
                {activo && <span className="text-xs font-bold text-blue-600">Seleccionado</span>}
              </button>
            );
          })}

          <button
            onClick={() => fileInputRef.current?.click()}
            className={`flex w-full items-center justify-between rounded-xl border-2 border-dashed px-4 py-3 text-left text-sm font-semibold transition ${
              usandoCustom
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-slate-300 text-slate-500 hover:border-slate-400"
            }`}
          >
            <span className="flex items-center gap-2 truncate">
              <Upload size={15} className="shrink-0" />
              <span className="truncate">
                {usandoCustom ? config.sonidoCustomNombre : "Subir sonido personalizado…"}
              </span>
            </span>
            {usandoCustom && <span className="shrink-0 text-xs font-bold text-blue-600">En uso</span>}
          </button>

          {usandoCustom && (
            <button
              onClick={quitarSonidoCustom}
              className="flex items-center gap-1.5 pt-1 text-xs font-semibold text-red-500 hover:text-red-600"
            >
              <Trash2 size={13} />
              Quitar sonido personalizado
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={onSeleccionarArchivo}
            className="hidden"
          />
        </div>

        {/* ── VOLUMEN ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700">Volumen</h2>
            <span className="text-sm font-extrabold text-blue-700">
              {config.gananciaPct}%
              <span className="ml-1 text-xs font-medium text-slate-400">
                (x{(config.gananciaPct / 100).toFixed(2)})
              </span>
            </span>
          </div>

          <div className="space-y-1.5">
            <input
              type="range"
              min={GANANCIA_MINIMO_PCT}
              max={GANANCIA_MAXIMO_PCT}
              step={GANANCIA_PASO_PCT}
              value={config.gananciaPct}
              onChange={onGananciaChange}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-[10px] font-medium text-slate-400">
              <span>0%</span>
              <span>100% (nativo)</span>
              <span>300%</span>
            </div>
          </div>

          <button
            onClick={probarSonido}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-5 py-3 font-bold text-white hover:bg-slate-900 transition"
          >
            <PlayCircle size={18} />
            Probar sonido
          </button>

          <audio ref={audioRef} src={sonidoActualSrc} preload="auto" className="hidden" />
        </div>

      </div>
    </div>
  );
}
