import { useEffect, useRef, useState } from "react";
import ordenGymSrc from "../sounds/OrdenGym.m4a";
//import cierreGymSrc from "../sounds/CierreGym.m4a";

const HORA_APERTURA = 9;
const HORA_CIERRE = 22;
const CHECK_MS = 10000;
const INTERVALO_ORDEN_MIN = 25;    // revisar cada 10 segundos
const GANANCIA_AUDIO = 2;          // amplificación vía Web Audio API (1 = volumen original, 2 = 200%)

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
  const cierreAudioRef = useRef(null);

  const audioCtxRef = useRef(null);
  const ordenGainRef = useRef(null);
  const cierreGainRef = useRef(null);

  const [audioHabilitado, setAudioHabilitado] = useState(false);

  const ultimaMarcaOrdenRef = useRef(null);
  const ultimaMarcaCierreRef = useRef(new Set());

  function getAudioContext() {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    return audioCtxRef.current;
  }

  // Conecta el <audio> a un GainNode para poder amplificar más allá del 100% nativo
  function conectarGanancia(audioRef, gainRef) {
    if (!audioRef.current || gainRef.current) return;
    const ctx = getAudioContext();
    const source = ctx.createMediaElementSource(audioRef.current);
    const gainNode = ctx.createGain();
    gainNode.gain.value = GANANCIA_AUDIO;
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    gainRef.current = gainNode;
  }

  async function reproducir(audioRef) {
    try {
      if (!audioRef.current) return;
      if (audioCtxRef.current?.state === "suspended") {
        await audioCtxRef.current.resume();
      }
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch (error) {
      console.warn("No se pudo reproducir el audio:", error?.message);
    }
  }

  async function desbloquearAudio() {
    try {
      conectarGanancia(ordenAudioRef, ordenGainRef);
      conectarGanancia(cierreAudioRef, cierreGainRef);
      await audioCtxRef.current?.resume();

      if (ordenAudioRef.current) {
        ordenAudioRef.current.muted = true;
        await ordenAudioRef.current.play();
        ordenAudioRef.current.pause();
        ordenAudioRef.current.currentTime = 0;
        ordenAudioRef.current.muted = false;
      }

      if (cierreAudioRef.current) {
        cierreAudioRef.current.muted = true;
        await cierreAudioRef.current.play();
        cierreAudioRef.current.pause();
        cierreAudioRef.current.currentTime = 0;
        cierreAudioRef.current.muted = false;
      }

      setAudioHabilitado(true);
    } catch (error) {
      console.warn("Audio bloqueado por el navegador:", error?.message);
    }
  }

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
  if (!audioHabilitado) return;

  const { fechaKey, minutoDelDia, hora, minuto, now } = getNowParts();

  const aperturaMin = HORA_APERTURA * 60;
  const cierreMin = HORA_CIERRE * 60;

  // 🔥 LOG TIEMPO ACTUAL
  console.log(
    `🕒 Hora actual: ${hora}:${pad(minuto)} | Minuto del día: ${minutoDelDia}`
  );

  if (minutoDelDia < aperturaMin || minutoDelDia >= cierreMin) {
    console.log("🚫 Fuera de horario del gym");
    return;
  }

  const minutosDesdeApertura = minutoDelDia - aperturaMin;

  // ⏳ CALCULAR CUÁNTO FALTA PARA EL PRÓXIMO ORDEN
  const resto = minutosDesdeApertura % INTERVALO_ORDEN_MIN;
  const faltanMin = resto === 0 ? 0 : INTERVALO_ORDEN_MIN - resto;

  const segundos = now.getSeconds();
  const faltanSeg = faltanMin * 60 - segundos;

  console.log(
    `⏳ Próximo audio en: ${faltanMin} min (${faltanSeg} seg)`
  );

  // 🔔 AUDIO DE ORDEN
  if (minutosDesdeApertura % INTERVALO_ORDEN_MIN === 0) {
    const marcaOrden = `${fechaKey}-${minutoDelDia}-orden`;

    if (ultimaMarcaOrdenRef.current !== marcaOrden) {
      console.log("🔊 Reproduciendo audio ORDEN");
      ultimaMarcaOrdenRef.current = marcaOrden;
      reproducir(ordenAudioRef);
    }
  }

  // 🔔 AUDIO DE CIERRE
  const marcasCierre = [
    cierreMin - 30,
    cierreMin - 15,
    cierreMin - 5,
  ];

  marcasCierre.forEach((minutoObjetivo) => {
    const diff = minutoObjetivo - minutoDelDia;

    console.log(
      `⏱ Falta para cierre (${minutoObjetivo}): ${diff} min`
    );

    if (minutoDelDia === minutoObjetivo) {
      const marca = `${fechaKey}-${minutoObjetivo}-cierre`;

      if (!ultimaMarcaCierreRef.current.has(marca)) {
        console.log("🔊 Reproduciendo audio CIERRE");
        ultimaMarcaCierreRef.current.add(marca);
        reproducir(cierreAudioRef);
      }
    }
  });

  if (minutoDelDia < aperturaMin + 1) {
    ultimaMarcaCierreRef.current = new Set();
  }
}

    checkAudios();
    const interval = setInterval(checkAudios, CHECK_MS);
    console.log(interval)
    return () => clearInterval(interval);
  }, [audioHabilitado]);

  return (
    <>
      <audio ref={ordenAudioRef} src={ordenGymSrc} preload="auto" />
      {/* <audio ref={cierreAudioRef} src={cierreGymSrc} preload="auto" /> */}

      {!audioHabilitado && (
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