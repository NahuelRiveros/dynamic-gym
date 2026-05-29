import { obtenerEstado } from "../services/software_suscripcion_service.js";

// ── Cache en memoria — evita golpear la DB en cada request ───────────────────
let _cache   = null;
let _cacheTs = 0;
const CACHE_MS = 5 * 60 * 1000; // 5 minutos

// Rutas que SIEMPRE pasan aunque la suscripción esté vencida
const RUTAS_LIBRES = [
  "/auth",        // login / logout / me
  "/suscripcion", // ver estado y renovar
  "/consulta",    // página pública Mi Plan (alumnos)
  "/health",      // health check
];

export async function verificarSuscripcion(req, res, next) {
  const ruta = req.path;

  // Siempre dejar pasar las rutas libres
  if (RUTAS_LIBRES.some((r) => ruta.startsWith("/" + r) || ruta === "/" + r)) {
    return next();
  }

  try {
    const ahora = Date.now();

    // Refrescar cache si venció
    if (!_cache || ahora - _cacheTs > CACHE_MS) {
      _cache   = await obtenerEstado();
      _cacheTs = ahora;
    }

    if (_cache?.bloqueado) {
      return res.status(402).json({
        ok:      false,
        codigo:  "SUSCRIPCION_VENCIDA",
        mensaje: "El plan del software está vencido. Renovalo para continuar usando el sistema.",
      });
    }

    return next();
  } catch {
    // Si falla la consulta de suscripción → dejar pasar (no bloquear por error técnico)
    return next();
  }
}

// Llamar después de extender/fijar la suscripción para que el bloqueo se levante al instante
export function invalidarCacheSuscripcion() {
  _cache   = null;
  _cacheTs = 0;
}
