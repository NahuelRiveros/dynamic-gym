import { http } from "./http";

/**
 * GET /estadisticas/Recaudaciones?anio=2026
 */
export async function getRecaudacionMensual(anio) {
  const r = await http.get("/estadisticas/recaudaciones", {
    params: anio ? { anio } : undefined,
  });
  
  return r.data;
  
}

export async function getRecaudacionDiaria(anio, mes) {
  const r = await http.get("/estadisticas/recaudaciones_diaria", {
    params: { anio, mes }, // mes: 1..12
  });
  return r.data;
}

/**
 * GET /estadisticas/alumnos_Nuevos?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 */
export async function getAlumnosNuevos({ desde, hasta } = {}) {
  const r = await http.get("/estadisticas/alumnos_Nuevos", {
    params: { ...(desde ? { desde } : {}), ...(hasta ? { hasta } : {}) },
  });
  return r.data;
}

/**
 * GET /estadisticas/vencimientos?dias=7
 */
export async function getVencimientos({ dias } = {}) {
  const r = await http.get("/estadisticas/vencimientos", {
    params: dias ? { dias } : undefined,
  });
  return r.data;
}

/**
 * GET /estadisticas/asistencias?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 */
export async function getAsistencias({ desde, hasta } = {}) {
  const r = await http.get("/estadisticas/asistencias", {
    params: { ...(desde ? { desde } : {}), ...(hasta ? { hasta } : {}) },
  });
  return r.data;
}

/**
 * GET /estadisticas/asistencias_horas?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 */
export async function getAsistenciasHoras({ desde, hasta } = {}) {
  const r = await http.get("/estadisticas/asistencias_horas", {
    params: { ...(desde ? { desde } : {}), ...(hasta ? { hasta } : {}) },
  });
  return r.data;
}

/**
 * GET /estadisticas/asistencias_horas_dia?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 */
export async function getAsistenciasHorasDia({ desde, hasta } = {}) {
  const r = await http.get("/estadisticas/asistencias_horas_dia", {
    params: { ...(desde ? { desde } : {}), ...(hasta ? { hasta } : {}) },
  });
  return r.data;
}
