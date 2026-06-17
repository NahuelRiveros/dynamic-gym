import { useState, useEffect } from "react";
import {
  Megaphone,
  Send,
  Users,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  Mail,
  Phone,
} from "lucide-react";
import {
  getPreviewDestinatarios,
  getNumerosWhatsApp,
  enviarPromocion,
} from "../../api/promociones_api";

/* ── helpers ─────────────────────────────────────────────────────────────── */

const FILTROS = [
  { value: "todos", label: "Todos los alumnos" },
  { value: "activos", label: "Solo activos" },
  { value: "vencidos", label: "Solo vencidos" },
];

const PLANTILLAS = [
  {
    id: "promocion",
    label: "Promoción",
    subject: "🔥 ¡Promo exclusiva para vos! — Dynamic Gym",
    titulo: "💪 ¡No te pierdas nuestras promociones especiales!",
    mensaje:
      "Queremos que sigas entrenando y alcanzando tus objetivos 🚀\n\n" +
      "Por eso este mes tenemos beneficios y promociones especiales para nuestros alumnos.\n\n" +
      "📲 Consultanos por este medio o acercate al gimnasio para conocer todos los detalles.\n\n" +
      "¡Te esperamos en Dynamic Gym! 💥",
  },
  {
    id: "vencimiento",
    label: "Vencimiento",
    subject: "🚨 Tu membresía está por vencer — Dynamic Gym",
    titulo: "📅 Recordatorio de renovación",
    mensaje:
      "Tu plan está próximo a finalizar y queremos que sigas entrenando sin interrupciones 💪\n\n" +
      "Renová tu membresía y continuá avanzando hacia tus objetivos junto a nosotros.\n\n" +
      "📲 Podés acercarte al gimnasio o escribirnos para más información.\n\n" +
      "¡Te esperamos en Dynamic Gym! 🔥",
  },
];

function construirHtml(titulo, mensaje) {
  return `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
  ${titulo ? `<h2 style="color:#2563eb;margin-bottom:8px">${titulo}</h2>` : ""}
  <p style="margin-top:0">Hola <strong>{nombre}</strong>, somos de Dynamic Gym.</p>
  <p style="white-space:pre-line;line-height:1.6">${mensaje}</p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
  <p style="color:#94a3b8;font-size:12px;margin:0">Dynamic Gym Formosa<br/>Este mensaje fue enviado a nuestros alumnos.</p>
</div>`;
}

/* ── componente ──────────────────────────────────────────────────────────── */

export default function PromocionesPage() {
  const [filtro, setFiltro] = useState("todos");
  const [plantilla, setPlantilla] = useState("promocion");
  const [subject, setSubject] = useState(PLANTILLAS[0].subject);
  const [titulo, setTitulo] = useState(PLANTILLAS[0].titulo);
  const [mensaje, setMensaje] = useState(PLANTILLAS[0].mensaje);
  const [preview, setPreview] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    setPreview(null);
    setResultado(null);
    setCargando(true);
    getPreviewDestinatarios(filtro)
      .then(setPreview)
      .catch(() => setPreview({ ok: false, total: 0 }))
      .finally(() => setCargando(false));
  }, [filtro]);

  function cambiarPlantilla(id) {
    const p = PLANTILLAS.find((x) => x.id === id);
    if (!p) return;
    setPlantilla(id);
    setSubject(p.subject);
    setTitulo(p.titulo);
    setMensaje(p.mensaje);
    setResultado(null);
  }

  async function handleEnviar() {
    if (!subject.trim() || !mensaje.trim()) return;
    if (!confirm(`¿Enviar email a ${preview?.total ?? "?"} destinatarios?`))
      return;

    setEnviando(true);
    setResultado(null);
    try {
      const html = construirHtml(titulo.trim(), mensaje.trim());
      const r = await enviarPromocion({
        filtro,
        subject: subject.trim(),
        html,
      });
      setResultado(r);
    } catch (err) {
      setResultado({
        ok: false,
        mensaje: err?.response?.data?.mensaje || "Error al enviar",
      });
    } finally {
      setEnviando(false);
    }
  }

  async function handleCopiarNumeros() {
    try {
      const r = await getNumerosWhatsApp(filtro);
      if (r.numeros?.length > 0) {
        await navigator.clipboard.writeText(r.numeros.join("\n"));
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2500);
      }
    } catch {
      // silencioso: el botón simplemente no cambia a "¡Copiado!"
    }
  }

  const puedeEnviar =
    subject.trim() && mensaje.trim() && (preview?.total ?? 0) > 0 && !enviando;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-2xl space-y-5">
        {/* ── ENCABEZADO ── */}
        <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
          <div className="h-1 w-full bg-linear-to-r from-violet-600 via-violet-500 to-purple-400" />
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 shadow-sm shadow-violet-500/25">
              <Megaphone size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900">
                Promociones
              </h1>
              <p className="text-xs text-slate-400">
                Enviá emails a tus alumnos
              </p>
            </div>
          </div>
        </div>

        {/* ── DESTINATARIOS ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1.5">
            <Users size={12} /> Destinatarios
          </h2>

          <div className="flex gap-2 flex-wrap">
            {FILTROS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFiltro(f.value)}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  filtro === f.value
                    ? "border-violet-300 bg-violet-600 text-white shadow-sm"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Counter */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Mail size={14} className="text-violet-500" />
              {cargando ? (
                <span className="flex items-center gap-1.5">
                  <RefreshCw size={11} className="animate-spin" /> Cargando…
                </span>
              ) : (
                <span>
                  <span className="font-extrabold text-slate-800 text-base">
                    {preview?.total ?? 0}
                  </span>{" "}
                  alumnos recibirán el email
                </span>
              )}
            </div>

            {/* Copiar números WhatsApp */}
            <button
              onClick={handleCopiarNumeros}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition"
            >
              {copiado ? (
                <Check size={12} className="text-emerald-500" />
              ) : (
                <Phone size={12} />
              )}
              {copiado ? "¡Copiado!" : "Copiar números"}
            </button>
          </div>

          {/* Muestra */}
          {preview?.muestra?.length > 0 && (
            <div className="space-y-1">
              {preview.muestra.map((d, i) => (
                <p key={i} className="text-xs text-slate-400 truncate">
                  • {d.nombre} — {d.email}
                </p>
              ))}
              {preview.total > 5 && (
                <p className="text-[11px] text-slate-400">
                  y {preview.total - 5} más…
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── MENSAJE ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1.5">
            <Mail size={12} /> Mensaje
          </h2>

          {/* Slider de plantillas */}
          <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1 gap-1">
            {PLANTILLAS.map((p) => (
              <button
                key={p.id}
                onClick={() => cambiarPlantilla(p.id)}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                  plantilla === p.id
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Asunto */}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
              Asunto del email
            </label>
            <input
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setResultado(null);
              }}
              placeholder="Ej: 🎯 Oferta especial para vos"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
            />
          </div>

          {/* Título */}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
              Título{" "}
              <span className="font-normal text-slate-400">
                (opcional — aparece en negrita arriba del mensaje)
              </span>
            </label>
            <input
              value={titulo}
              onChange={(e) => {
                setTitulo(e.target.value);
                setResultado(null);
              }}
              placeholder="Ej: ¡Promoción de mayo!"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
            />
          </div>

          {/* Saludo fijo */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm text-slate-500">
            Hola{" "}
            <span className="font-semibold text-slate-700">
              [nombre del alumno]
            </span>
            , somos de Dynamic Gym.
          </div>

          {/* Mensaje */}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
              Mensaje
            </label>
            <textarea
              value={mensaje}
              onChange={(e) => {
                setMensaje(e.target.value);
                setResultado(null);
              }}
              rows={5}
              placeholder="Escribí acá tu promoción, aviso o comunicado..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 resize-y"
            />
          </div>

          {/* Resultado */}
          {resultado && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                resultado.ok
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {resultado.ok ? (
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">{resultado.mensaje}</p>
                    {resultado.fallidos?.length > 0 && (
                      <p className="text-xs mt-1 opacity-75">
                        {resultado.fallidos.length} fallido(s):{" "}
                        {resultado.fallidos.map((f) => f.email).join(", ")}
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
            disabled={!puedeEnviar}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 font-bold text-white shadow-sm shadow-violet-500/20 hover:bg-violet-700 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {enviando ? (
              <>
                <RefreshCw size={15} className="animate-spin" /> Enviando…
              </>
            ) : (
              <>
                <Send size={15} /> Enviar a {preview?.total ?? "?"} alumnos
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
