import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { http } from "../api/http.js";
import { authConfig } from "../config/auth_config.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  const token = localStorage.getItem(authConfig.storageKey);

  async function cargarMe() {
    try {
      const r = await http.get(authConfig.endpoints.me);
      setUsuario(r.data?.usuario || r.data?.user || r.data);
    } catch {
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    // si hay token, intentamos /me al iniciar
    if (token) cargarMe();
    else setCargando(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(payload) {
    const r = await http.post(authConfig.endpoints.login, payload);
    const nuevoToken = r.data?.token;

    if (nuevoToken) localStorage.setItem(authConfig.storageKey, nuevoToken);
    // luego traemos el usuario real desde /me para no depender del response del login
    await cargarMe();

    return r.data;
  }

  async function register(payload) {
    const r = await http.post(authConfig.endpoints.register, payload);
    return r.data;
  }

  async function logout() {
    try {
      await http.post(authConfig.endpoints.logout);
    } catch {
      // si falla igual limpiamos local
    } finally {
      localStorage.removeItem(authConfig.storageKey);
      setUsuario(null);
    }
  }

  const value = useMemo(
    () => ({
      usuario,
      cargando,
      isAuth: !!usuario,
      login,
      logout,
      register, 
      recargarUsuario: cargarMe,
    }),
    [usuario, cargando]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
