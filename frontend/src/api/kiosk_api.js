import { http } from "./http";

export async function kioskIngreso(dni) {
  const r = await http.post("/ingresos/registrar", { dni });
  return r.data;
}
