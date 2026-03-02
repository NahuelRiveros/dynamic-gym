import { http } from "./http";

export async function getCatalogos() {
  const r = await http.get("/catalogos");
  return r.data;
}