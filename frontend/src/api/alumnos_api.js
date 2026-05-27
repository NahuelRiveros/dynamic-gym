import { http } from "./http";

export async function registrarAlumno(payload) {
  const r = await http.post("/personas/registrar", payload);
  return r.data;
}

export async function getAlumnosListado(params = {}) {
  const r = await http.get("/alumnos/listado", { params });
  return r.data;
}

export async function getAlumnoDetalle(id) {
  const r = await http.get(`/alumnos/detalle/${id}`);
  return r.data;
}

export async function actualizarEstadosAlumnos() {
  const r = await http.post("/admin/alumnos/actualizar-estados");
  return r.data;
}

export async function getAlumnosCumples(params = {}){
  const r = await http.get("/alumnos/cumples", { params })
  return r.data;
}

// Consulta pública por DNI — no requiere auth
export async function consultarPlanPorDni(dni) {
  const r = await http.get(`/consulta/plan/${encodeURIComponent(dni)}`);
  return r.data;
}