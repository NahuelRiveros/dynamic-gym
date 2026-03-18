import { useState, useEffect } from "react";
import { kioskIngreso } from "../api/kiosk_api.js";
import KioskResultModal from "../components/modal/kiosk_result_modal.jsx";
import KioskErrorModal from "../components/modal/kiosk_error_modal.jsx";
import SubmitButton from "../components/form/submit_button.jsx";
import { BadgeCheck, TriangleAlert } from "lucide-react";

import sonidoOk from "../sounds/IngresoCorrecto.m4a";
import sonidoError from "../sounds/IngresoErroneo.wav";

export default function KioskPage() {
  const [dni, setDni] = useState("");
  const [resp, setResp] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [mostrarOk, setMostrarOk] = useState(false);
  const [mostrarError, setMostrarError] = useState(false);

  const dniLimpio = dni.trim();
  const dniValido = dniLimpio.length >= 6;

  function reproducirSonido(src) {
    try {
      const audio = new Audio(src);
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } catch (error) {
      console.error("No se pudo reproducir el sonido:", error);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!dniValido) return;

    setResp(null);
    setCargando(true);

    try {
      const r = await kioskIngreso(dniLimpio);
      setResp(r);

      if (r?.ok) {
        reproducirSonido(sonidoOk);
        setMostrarOk(true);
        setMostrarError(false);
      } else {
        reproducirSonido(sonidoError);
        setMostrarError(true);
        setMostrarOk(false);
      }

      setDni("");
    } catch (err) {
      const mensaje =
        err?.response?.data?.mensaje || err?.message || "Error inesperado";

      reproducirSonido(sonidoError);
      setResp({ ok: false, mensaje });
      setMostrarError(true);
      setMostrarOk(false);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    if (mostrarOk || mostrarError) {
      const t = setTimeout(() => {
        setMostrarOk(false);
        setMostrarError(false);
        setResp(null);
      }, 30000);
      return () => clearTimeout(t);
    }
  }, [mostrarOk, mostrarError]);

  const ok = resp?.ok === true;
  const alumno = resp?.alumno;
  const plan = resp?.plan;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-blue-100">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-black/5 bg-white/80 shadow-2xl backdrop-blur p-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-600/10 px-4 py-1 text-sm font-semibold text-blue-700">
            Control de ingreso
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900">
            Ingreso por DNI
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Ingresá tu DNI para registrar tu asistencia.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <input
              autoFocus
              inputMode="numeric"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="DNI"
              className={[
                "w-full rounded-2xl px-4 py-4 text-3xl text-gray-900",
                "border border-gray-300 bg-white",
                "outline-none focus:ring-2 focus:ring-blue-500/60",
                "placeholder:text-gray-400 text-center font-bold",
              ].join(" ")}
            />

            <div className="flex justify-center">
              <SubmitButton
                label="Ingresar"
                loading={cargando}
                loadingLabel="Procesando..."
                disabled={!dniValido}
              />
            </div>

            {!dniValido && (
              <div className="text-xs text-gray-500">
                Ingresá al menos 6 dígitos.
              </div>
            )}
          </form>

          {resp && (
            <div
              className={[
                "mt-6 rounded-2xl border p-4 text-left",
                ok
                  ? "border-blue-500/30 bg-blue-50"
                  : "border-red-500/30 bg-red-50",
              ].join(" ")}
            >
              <div className="flex items-center gap-2 font-bold">
                {ok ? (
                  <>
                    <BadgeCheck className="text-blue-600" size={18} />
                    <span className="text-blue-700">Ingreso OK</span>
                  </>
                ) : (
                  <>
                    <TriangleAlert className="text-red-600" size={18} />
                    <span className="text-red-700">Error</span>
                  </>
                )}
              </div>

              <div className="mt-2 text-sm text-gray-700">
                {resp?.mensaje || resp?.motivo}
              </div>

              {(alumno?.nombre || alumno?.apellido) && (
                <div className="mt-3 text-sm text-gray-700">
                  Alumno:{" "}
                  <b className="text-gray-900">
                    {alumno?.nombre} {alumno?.apellido}
                  </b>
                </div>
              )}

              {plan?.ingresos_restantes != null && (
                <div className="mt-1 text-sm text-gray-700">
                  Ingresos restantes:{" "}
                  <b className="text-gray-900">{plan.ingresos_restantes}</b>
                </div>
              )}
            </div>
          )}
        </div>

        {mostrarOk && resp?.ok && (
          <KioskResultModal
            resp={resp}
            onClose={() => {
              setMostrarOk(false);
              setResp(null);
            }}
          />
        )}

        {mostrarError && resp && !resp?.ok && (
          <KioskErrorModal
            resp={resp}
            onClose={() => {
              setMostrarError(false);
              setResp(null);
            }}
          />
        )}
      </div>
    </div>
  );
}