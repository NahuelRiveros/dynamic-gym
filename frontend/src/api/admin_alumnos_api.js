import { http } from "./http";

// Buscar plan vigente por DNI
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