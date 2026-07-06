import { useEffect, useRef, useState } from "react";
import {
  AVISO_CONFIG_EVENT,
  AVISO_CONFIG_STORAGE_KEY,
  getAvisoConfig,
  getSonidoSrc,
} from "../config/audio_config";

const HORA_APERTURA = 9;
const HORA_CIERRE = 22;
const CHECK_MS = 10000;

function pad(n) {
  return String(n).padStart(2, "0");
}

function getNowParts() {
  const now = new Date();

  return {
    now,
    hora: now.getHours(),
    minuto: now.getMinutes(),
    minutoDelDia: now.getHours() * 60 + now.getMinutes(),
    fechaKey: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    hhmm: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
  };
}

export default function GymAudioScheduler() {
  const ordenAudioRef = useRef(null);

  const audioCtxRef = useRef(null);
  const ordenGainRef = useRef(null);

  const [audioHabilitado, setAudioHabilitado] = useState(false);
  const [config, setConfig] = useState(getAvisoConfig());

  const ultimaMarcaOrdenRef = useRef(null);

  const sonidoSrc = getSonidoSrc(config);

  function getAudioContext() {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    return audioCtxRef.current;
  }

  // Conecta el <audio> a un GainNode para poder amplificar más allá del 100% nativo
  function conectarGanancia() {
    if (!ordenAudioRef.current || ordenGainRef.current) return;
    const ctx = getAudioContext();
    const source = ctx.createMediaElementSource(ordenAudioRef.current);
    const gainNode = ctx.createGain();
    gainNode.gain.value = config.gananciaPct / 100;
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    ordenGainRef.current = gainNode;
  }

  async function reproducir() {
    try {
      if (!ordenAudioRef.current) return;
      if (audioCtxRef.current?.state === "suspended") {
        await audioCtxRef.current.resume();
      }
      ordenAudioRef.current.currentTime = 0;
      await ordenAudioRef.current.play();
    } catch (error) {
      console.warn("No se pudo reproducir el audio:", error?.message);
    }
  }

  async function desbloquearAudio() {
    try {
      conectarGanancia();
      await audioCtxRef.current?.resume();

      if (ordenAudioRef.current) {
        ordenAudioRef.current.muted = true;
        await ordenAudioRef.current.play();
        ordenAudioRef.current.pause();
        ordenAudioRef.current.currentTime = 0;
        ordenAudioRef.current.muted = false;
      }

      setAudioHabilitado(true);
    } catch (error) {
      console.warn("Audio bloqueado por el navegador:", error?.message);
    }
  }

  // Mantiene sincronizada la ganancia con lo elegido en el panel de Admin.
  useEffect(() => {
    if (ordenGainRef.current) ordenGainRef.current.gain.value = config.gananciaPct / 100;
  }, [config.gananciaPct]);

  // Escucha cambios de configuración: en esta pestaña (evento custom) y en otras (evento storage).
  useEffect(() => {
    const onConfigChange = (event) => {
      setConfig(event.detail && typeof event.detail === "object" ? event.detail : getAvisoConfig());
    };
    const onStorage = (event) => {
      if (event.key === AVISO_CONFIG_STORAGE_KEY) setConfig(getAvisoConfig());
    };

    window.addEventListener(AVISO_CONFIG_EVENT, onConfigChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(AVISO_CONFIG_EVENT, onConfigChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    const onFirstInteraction = () => {
      desbloquearAudio();
      window.removeEventListener("click", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
      window.removeEventListener("touchstart", onFirstInteraction);
    };

    window.addEventListener("click", onFirstInteraction);
    window.addEventListener("keydown", onFirstInteraction);
    window.addEventListener("touchstart", onFirstInteraction);

    return () => {
      window.removeEventListener("click", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
      window.removeEventListener("touchstart", onFirstInteraction);
    };
  }, []);

  useEffect(() => {
    function checkAudios() {
      if (!audioHabilitado || !config.habilitado) return;

      const { fechaKey, minutoDelDia, hora, minuto, now } = getNowParts();

      const aperturaMin = HORA_APERTURA * 60;
      const cierreMin = HORA_CIERRE * 60;
      const intervaloMin = config.intervaloMinutos > 0 ? config.intervaloMinutos : 25;

      console.log(
        `🕒 Hora actual: ${hora}:${pad(minuto)} | Minuto del día: ${minutoDelDia}`
      );

      if (minutoDelDia < aperturaMin || minutoDelDia >= cierreMin) {
        console.log("🚫 Fuera de horario del gym");
        return;
      }

      const minutosDesdeApertura = minutoDelDia - aperturaMin;

      const resto = minutosDesdeApertura % intervaloMin;
      const faltanMin = resto === 0 ? 0 : intervaloMin - resto;

      const segundos = now.getSeconds();
      const faltanSeg = faltanMin * 60 - segundos;

      console.log(
        `⏳ Próximo audio en: ${faltanMin} min (${faltanSeg} seg)`
      );

      if (minutosDesdeApertura % intervaloMin === 0) {
        const marcaOrden = `${fechaKey}-${minutoDelDia}-orden`;

        if (ultimaMarcaOrdenRef.current !== marcaOrden) {
          console.log("🔊 Reproduciendo aviso");
          ultimaMarcaOrdenRef.current = marcaOrden;
          reproducir();
        }
      }
    }

    checkAudios();
    const interval = setInterval(checkAudios, CHECK_MS);
    return () => clearInterval(interval);
  }, [audioHabilitado, config.habilitado, config.intervaloMinutos]);

  return (
    <>
      <audio ref={ordenAudioRef} src={sonidoSrc} preload="auto" />

      {!audioHabilitado && config.habilitado && (
        <button
          onClick={desbloquearAudio}
          className="fixed bottom-6 right-6 z-9998 flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-4 text-base font-bold text-white shadow-2xl ring-4 ring-orange-300 animate-pulse hover:bg-orange-600 hover:animate-none transition-colors"
        >
          <span className="text-xl">🔔</span>
          Activar avisos de audio
        </button>
      )}
    </>
  );
}
