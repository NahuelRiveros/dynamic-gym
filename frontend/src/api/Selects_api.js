import { http } from "./http";

export async function fetchSelectOpstions(){
    const r = await http.get("/catalogos");
    return r.data;
}
