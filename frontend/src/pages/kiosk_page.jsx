import { useState, useEffect, useRef } from "react";
import { kioskIngreso } from "../api/kiosk_api.js";
import { getAlumnosCumples } from "../api/alumnos_api.js";
import KioskResultModal from "../components/modal/kiosk_result_modal.jsx";
import KioskErrorModal from "../components/modal/kiosk_error_modal.jsx";
import KioskLogModal, { guardarLogKiosk } from "../components/modal/kiosk_log_modal.jsx";
import AlertasDropdown from "../components/alertas/AlertasDropdown.jsx";
import { Dumbbell } from "lucide-react";

import sonidoOk from "../sounds/IngresoCorrecto.m4a";
import sonidoError from "../sounds/IngresoErroneo.wav";

export default function KioskPage() {
  const [dni, setDni] = useState("");
  const [resp, setResp] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [mostrarOk, setMostrarOk] = useState(false);
  const [mostrarError, setMostrarError] = useState(false);
  const [mostrarLog, setMostrarLog] = useState(false);
  const [hora, setHora] = useState("");
  const [cumples, setCumples] = useState({ hoy: [], proximos: [] });
  const inputRef = useRef(null);
  const clicksBrandingRef = useRef(0);
  const timerBrandingRef = useRef(null);

  const dniLimpio = dni.trim();
  const dniValido = dniLimpio.length >= 6;

  // Reloj en vivo con timezone Argentina
  useEffect(() => {
    function tick() {
      setHora(
        new Date().toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "America/Argentina/Buenos_Aires",
        })
      );
    }
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-focus input cuando se cierran los modales
  useEffect(() => {
    if (!mostrarOk && !mostrarError) {
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [mostrarOk, mostrarError]);

  // Cargar cumpleaños
  useEffect(() => {
    async function cargar() {
      try {
        const data = await getAlumnosCumples({ dias: 3 });
        setCumples({ hoy: data.hoy || [], proximos: data.proximos || [] });
      } catch {}
    }
    cargar();
    const t = setInterval(cargar, 60000);
    return () => clearInterval(t);
  }, []);

  // Activa el log con 5 clicks rápidos sobre el branding del pie
  function onClickBranding() {
    clicksBrandingRef.current += 1;
    clearTimeout(timerBrandingRef.current);
    if (clicksBrandingRef.current >= 5) {
      clicksBrandingRef.current = 0;
      setMostrarLog(true);
    } else {
      timerBrandingRef.current = setTimeout(() => {
        clicksBrandingRef.current = 0;
      }, 2000);
    }
  }

  function reproducirSonido(src) {
    try {
      const audio = new Audio(src);
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch {}
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!dniValido || cargando) return;

    setResp(null);
    setCargando(true);

    try {
      const r = await kioskIngreso(dniLimpio);
      setResp(r);
      setDni("");

      if (r?.ok) {
        reproducirSonido(sonidoOk);
        setMostrarOk(true);
        setMostrarError(false);
      } else {
        guardarLogKiosk({ dni: dniLimpio, codigo: r?.codigo || "ERROR", mensaje: r?.mensaje || "Respuesta negada" });
        reproducirSonido(sonidoError);
        setMostrarError(true);
        setMostrarOk(false);
      }
    } catch (err) {
      const data = err?.response?.data;
      const codigo = data?.codigo || "ERROR";
      const mensaje = data?.mensaje || err?.message || "Error inesperado";
      guardarLogKiosk({ dni: dniLimpio, codigo, mensaje });
      reproducirSonido(sonidoError);
      setResp({ ok: false, codigo, mensaje });
      setMostrarError(true);
      setMostrarOk(false);
      setDni("");
    } finally {
      setCargando(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
        .kiosk-display { font-family: 'Barlow Condensed', sans-serif; }
        .kiosk-body    { font-family: 'DM Sans', sans-serif; }

        @keyframes kiosk-pulse-ring {
          0%   { box-shadow: 0 0 0 0   rgba(14,165,233,0.35); }
          70%  { box-shadow: 0 0 0 14px rgba(14,165,233,0);   }
          100% { box-shadow: 0 0 0 0   rgba(14,165,233,0);    }
        }
        .kiosk-input:focus {
          animation: kiosk-pulse-ring 2.2s ease-in-out infinite;
        }
      `}</style>

      <div className="kiosk-body min-h-screen bg-[#060a12] flex flex-col overflow-hidden select-none">

        {/* ── TOP BAR ── */}
        <div className="flex items-center justify-between px-8 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15">
              <Dumbbell size={22} className="text-sky-400" />
            </div>
            <span className="kiosk-display text-xl font-bold uppercase tracking-widest text-white">
              Dynamic Gym
            </span>
          </div>

          <div className="flex items-center gap-5">
            <AlertasDropdown hoy={cumples.hoy} proximos={cumples.proximos} />
            <span className="kiosk-display text-2xl font-bold tabular-nums tracking-widest text-sky-400">
              {hora}
            </span>
          </div>
        </div>

        {/* Línea de acento */}
        <div className="h-px mx-8 bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />

        {/* ── CONTENIDO CENTRAL ── */}
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="w-full max-w-lg text-center">

            <div className="mb-8">
              <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-400">
                Control de acceso
              </span>
              <h1 className="kiosk-display mt-3 text-6xl md:text-7xl font-black uppercase leading-none text-white">
                INGRESÁ TU
                <span className="block text-sky-400">DNI</span>
              </h1>
              <p className="mt-4 text-gray-500 text-sm leading-relaxed">
                Escribí o escaneá tu DNI para registrar tu asistencia.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <input
                ref={inputRef}
                autoFocus
                inputMode="numeric"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="00.000.000"
                disabled={cargando}
                className="kiosk-display kiosk-input w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-4xl text-white text-center font-bold tracking-widest placeholder:text-gray-700 focus:border-sky-500/60 focus:bg-white/8 focus:outline-none transition-colors disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!dniValido || cargando}
                className="w-full rounded-2xl bg-sky-500 py-4 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-sky-500/25 hover:bg-sky-400 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-35 disabled:pointer-events-none"
              >
                {cargando ? "Verificando…" : "Registrar ingreso"}
              </button>
            </form>

            <p className="mt-6 text-[11px] uppercase tracking-wider text-gray-700">
              Tu acceso queda registrado automáticamente
            </p>
          </div>
        </div>

        {/* ── BRANDING PIE ── */}
        <div className="pb-6 text-center">
          <div className="h-px mx-8 bg-linear-to-r from-transparent via-white/5 to-transparent mb-4" />
          {/* 5 clicks rápidos abre el log de errores */}
          <span
            onClick={onClickBranding}
            className="cursor-default text-[11px] uppercase tracking-[0.3em] text-gray-700 select-none"
          >
            Dynamic Gym · Formosa
          </span>
        </div>

      </div>

      {/* ── MODALES ── */}
      {mostrarOk && resp?.ok && (
        <KioskResultModal
          resp={resp}
          autoCloseMs={8000}
          onClose={() => { setMostrarOk(false); setResp(null); }}
        />
      )}

      {mostrarError && resp && !resp.ok && (
        <KioskErrorModal
          resp={resp}
          autoCloseMs={6000}
          onClose={() => { setMostrarError(false); setResp(null); }}
        />
      )}

      {mostrarLog && (
        <KioskLogModal onClose={() => setMostrarLog(false)} />
      )}
    </>
  );
}
