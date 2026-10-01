import request from "supertest";

/** Inicia sesión con un usuario de USUARIOS_TEST y devuelve su token. */
export async function tokenDe(app, { email, password }) {
  const r = await request(app).post("/api/auth/login").send({ email, password });
  if (!r.body.token) throw new Error(`No se pudo iniciar sesión como ${email}: ${r.body.mensaje}`);
  return r.body.token;
}
