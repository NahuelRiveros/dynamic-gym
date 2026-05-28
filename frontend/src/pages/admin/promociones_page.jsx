import { useState, useEffect } from "react";
import {
  Megaphone, Send, Users, CheckCircle2, AlertTriangle,
  Copy, Check, RefreshCw, Mail, Phone,
} from "lucide-react";
import { getPreviewDestinatarios, getNumerosWhatsApp, enviarPromocion } from "../../api/promociones_api";

/* ── helpers ─────────────────────────────────────────────────────────────── */

const FILTROS = [
  { value: "todos",    label: "Todos los alumnos" },
  { value: "activos",  label: "Solo activos" },
  { value: "vencidos", label: "Solo vencidos" },
  { value: "con_plan", label: "Con plan vigente" },
  { value: "sin_plan", label: "Sin plan vigente" },
];

const PLANTILLAS = [
  {
    label: "Promoción general",
    subject: "🎯 Oferta especial para vos — Dynamic Gym",
    html: `<div style="font-family:sans-serif;max-width:600px;margin:auto">
  <h2 style="color:#2563eb">¡Hola {nombre}! 👋</h2>
  <p>Tenemos una <strong>oferta especial</strong> que no te podés perder.</p>
  <p>Escribí tu promoción acá...</p>
  <p>¡Te esperamos en Dynamic Gym!</p>
  <p style="color:#64748b;font-size:12px">Dynamic Gym Formosa</p>
</div>`,
  },
  {
    label: "Recordatorio de renovación",
    subject: "⏰ Tu plan vence pronto — Dynamic Gym",
    html: `<div style="font-family:sans-serif;max-width:600px;margin:auto">
  <h2 style="color:#f59e0b">¡Hola {nombre}!</h2>
  <p>Te recordamos que tu plan está por vencer.</p>
  <p>Acercate al gimnasio o contactanos para renovarlo y no perder tu lugar.</p>
  <p>¡Seguí entrenando fuerte!</p>
  <p style="color:#64748b;font-size:12px">Dynamic Gym Formosa</p>
</div>`,
  },
  {
    label: "Bienvenida",
    subject: "🏋️ ¡Bienvenido a Dynamic Gym!",
    html: `<div style="font-family:sans-serif;max-width:600px;margin:auto">
  <h2 style="color:#10b981">¡Bienvenido/a {nombre}!</h2>
  <p>Nos alegra tenerte en la familia de <strong>Dynamic Gym</strong>.</p>
  <p>Cualquier consulta estamos a disposición.</p>
  <p>¡A entrenar!</p>
  <p style="color:#64748b;font-size:12px">Dynamic Gym Formosa</p>
</div>`,
  },
];

/* ── componente ──────────────────────────────────────────────────────────── */

export default function PromocionesPage() {
  const [filtro,   setFiltro]   = useState("todos");
  const [subject,  setSubject]  = useState(PLANTILLAS[0].subject);
  const [html,     setHtml]     = useState(PLANTILLAS[0].html);
  const [preview,  setPreview]  = useState(null);
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [copiado,  setCopiado]  = useState(false);
  const [numeros,  setNumeros]  = useState(null);

  // Cargar preview cuando cambia el filtro
  useEffect(() => {
    setPreview(null);
    setResultado(null);
    setCargando(true);
    getPreviewDestinatarios(filtro)
      .then(setPreview)
      .catch(() => setPreview({ ok: false, total: 0 }))
      .finally(() => setCargando(false));
  }, [filtro]);

  function aplicarPlantilla(p) {
    setSubject(p.subject);
    setHtml(p.html);
    setResultado(null);
  }

  async function handleEnviar() {
    if (!subject.trim() || !html.trim()) return;
    if (!confirm(`¿Enviar email a ${preview?.total ?? "?"} destinatarios?`)) return;

    setEnviando(true);
    setResultado(null);
    try {
      const r = await enviarPromocion({ filtro, subject, html });
      setResultado(r);
    } catch (err) {
      setResultado({ ok: false, mensaje: err?.response?.data?.mensaje || "Error al enviar" });
    } finally {
      setEnviando(false);
    }
  }

  async function handleCopiarNumeros() {
    const r = await getNumerosWhatsApp(filtro);
    setNumeros(r);
    if (r.numeros?.length > 0) {
      navigator.clipboard.writeText(r.numeros.join("\n"));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-3xl space-y-5">

        {/* ── ENCABEZADO ── */}
        <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
          <div className="h-1 w-full bg-linear-to-r from-violet-600 via-violet-500 to-purple-400" />
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 shadow-sm shadow-violet-500/25">
              <Megaphone size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900">Promociones</h1>
              <p className="text-xs text-slate-400">Enviá emails masivos a tus alumnos</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_1.6fr]">

          {/* ── PANEL IZQUIERDO: filtro + info ── */}
          <div className="space-y-4">

            {/* Filtro */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1.5">
                <Users size={12} /> Destinatarios
              </h2>
              <div className="space-y-1.5">
                {FILTROS.map((f) => (
                  <label key={f.value}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition ${
                      filtro === f.value
                        ? "border-violet-300 bg-violet-50 font-semibold text-violet-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <input type="radio" name="filtro" value={f.value}
                      checked={filtro === f.value}
                      onChange={() => setFiltro(f.value)}
                      className="accent-violet-600"
                    />
                    {f.label}
                  </label>
                ))}
              </div>

              {/* Preview counter */}
              <div className={`rounded-xl border px-3 py-2.5 text-center ${
                cargando ? "border-slate-200 bg-slate-50" : "border-violet-200 bg-violet-50"
              }`}>
                {cargando ? (
                  <span className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
                    <RefreshCw size={11} className="animate-spin" /> Cargando…
                  </span>
                ) : (
                  <>
                    <p className="text-2xl font-extrabold text-violet-700">{preview?.total ?? 0}</p>
                    <p className="text-[11px] text-violet-500 font-medium flex items-center justify-center gap-1">
                      <Mail size={10} /> alumnos con email
                    </p>
                  </>
                )}
              </div>

              {/* Muestra */}
              {preview?.muestra?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Ejemplo</p>
                  {preview.muestra.map((d, i) => (
                    <div key={i} className="text-xs text-slate-500 truncate">• {d.nombre} — {d.email}</div>
                  ))}
                  {preview.total > 5 && (
                    <p className="text-[10px] text-slate-400">y {preview.total - 5} más…</p>
                  )}
                </div>
              )}
            </div>

            {/* Exportar números WhatsApp */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1.5">
                <Phone size={12} /> WhatsApp
              </h2>
              <p className="text-xs text-slate-500">
                Copiá los números para crear una <strong>lista de difusión</strong> en tu celular.
              </p>
              <button
                onClick={handleCopiarNumeros}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                {copiado ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                {copiado ? "¡Copiado!" : "Copiar números"}
              </button>
              {numeros && (
                <p className="text-[11px] text-slate-400 text-center">
                  {numeros.total} número(s) copiado(s)
                </p>
              )}
            </div>
          </div>

          {/* ── PANEL DERECHO: editor ── */}
          <div className="space-y-4">

            {/* Plantillas */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">Plantillas rápidas</h2>
              <div className="flex flex-wrap gap-2">
                {PLANTILLAS.map((p) => (
                  <button key={p.label}
                    onClick={() => aplicarPlantilla(p)}
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 transition"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Editor */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">Mensaje</h2>

              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Asunto</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Asunto del email..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 flex items-center justify-between">
                  <span>Cuerpo (HTML)</span>
                  <span className="font-normal text-slate-400">Usá <code className="bg-slate-100 px-1 rounded">{"{nombre}"}</code> para personalizar</span>
                </label>
                <textarea
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  rows={10}
                  placeholder="<p>Hola {nombre}...</p>"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-700 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 resize-y"
                />
              </div>

              {/* Resultado */}
              {resultado && (
                <div className={`rounded-xl border px-4 py-3 text-sm ${
                  resultado.ok
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}>
                  {resultado.ok ? (
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold">{resultado.mensaje}</p>
                        {resultado.fallidos?.length > 0 && (
                          <p className="text-xs mt-1 opacity-75">
                            {resultado.fallidos.length} fallido(s): {resultado.fallidos.map(f => f.email).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="shrink-0" />
                      <p>{resultado.mensaje}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Botón enviar */}
              <button
                onClick={handleEnviar}
                disabled={enviando || !subject.trim() || !html.trim() || (preview?.total ?? 0) === 0}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 font-bold text-white shadow-sm shadow-violet-500/20 hover:bg-violet-700 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enviando
                  ? <><RefreshCw size={15} className="animate-spin" /> Enviando…</>
                  : <><Send size={15} /> Enviar a {preview?.total ?? "?"} alumnos</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
