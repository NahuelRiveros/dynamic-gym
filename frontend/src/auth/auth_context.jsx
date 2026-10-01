import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "../api/http.js";
import { authConfig } from "../config/auth_config.js";

const AuthContext = createContext(null);

const CLAVE_SESION = ["sesion"];
const hayToken = () => Boolean(localStorage.getItem(authConfig.storageKey));

async function pedirUsuario() {
  try {
    const r = await http.get(authConfig.endpoints.me);
    return r.data?.usuario ?? null;
  } catch {
    // Token vencido o inválido: sin sesión (http.js ya limpia el token ante un 401).
    return null;
  }
}

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  // La consulta de /me solo corre si hay token guardado; login y logout lo cambian.
  const [conToken, setConToken] = useState(hayToken);

  const sesion = useQuery({
    queryKey: CLAVE_SESION,
    queryFn: pedirUsuario,
    enabled: conToken,
    staleTime: Infinity, // el usuario no cambia solo: se vuelve a pedir al iniciar sesión
    retry: false,
  });

  const usuario = conToken ? (sesion.data ?? null) : null;
  const cargando = conToken && sesion.isPending;

  const recargarUsuario = useCallback(
    () => queryClient.fetchQuery({ queryKey: CLAVE_SESION, queryFn: pedirUsuario, staleTime: 0 }),
    [queryClient],
  );

  const login = useCallback(async (payload) => {
    const r = await http.post(authConfig.endpoints.login, payload);
    const nuevoToken = r.data?.token;

    if (nuevoToken) {
      localStorage.setItem(authConfig.storageKey, nuevoToken);
      // luego traemos el usuario real desde /me para no depender del response del login
      await recargarUsuario();
      setConToken(true);
    }

    return r.data;
  }, [recargarUsuario]);

  const logout = useCallback(async () => {
    try {
      await http.post(authConfig.endpoints.logout);
    } catch {
      // si falla igual limpiamos local
    } finally {
      localStorage.removeItem(authConfig.storageKey);
      setConToken(false);
      // Nada de lo que vio esta sesión queda en caché para la próxima (otro usuario en la misma PC).
      queryClient.clear();
    }
  }, [queryClient]);

  const value = useMemo(
    () => ({
      usuario,
      cargando,
      isAuth: !!usuario,
      login,
      logout,
      recargarUsuario,
    }),
    [usuario, cargando, login, logout, recargarUsuario]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
