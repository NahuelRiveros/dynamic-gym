import { http } from "./http";

// Buscar plan vigente por DNI (también retorna datos personales)
export async function buscarPlanVigente(documento) {
  const r = await http.get("/admin/alumnos/actualizar-plan", {
    params: { documento },
  });
  return r.data;
}

// Actualizar plan vigente
export async function actualizarPlanVigente(payload) {
  const r = await http.put("/admin/alumnos/actualizar-plan", payload);
  return r.data;
}

// Actualizar datos personales del alumno
export async function actualizarPersona(payload) {
  const r = await http.patch("/admin/alumnos/actualizar-persona", payload);
  return r.data;
}