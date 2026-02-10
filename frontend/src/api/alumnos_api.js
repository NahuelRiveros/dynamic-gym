import { http } from "./http";

export async function registrarAlumno(payload) {
  const r = await http.post("/personas/registrar", payload);
  return r.data;
}
