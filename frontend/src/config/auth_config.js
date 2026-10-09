export const authConfig = {
  storageKey: "token", // donde se guarda el token
  endpoints: {
    login: "/auth/login",
    me: "/auth/me",
    logout: "/auth/logout",
    register: "/auth/register", // lo dejamos listo aunque no lo uses todavía
  },
};
