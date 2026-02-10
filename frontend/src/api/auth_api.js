import { http } from "./http";

export async function authLogin(data) {
  const r = await http.post("/auth/login", data);
  const token = r.data?.token;
  if (token) localStorage.setItem("token", token);
  return r.data;
}

export async function authMe() {
  const r = await http.get("/auth/me");
  return r.data;
}

export async function authLogout() {
  try {
    await http.post("/auth/logout");
  } finally {
    localStorage.removeItem("token");
  }
}
