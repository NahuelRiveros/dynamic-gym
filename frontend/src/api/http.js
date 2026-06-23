import axios from "axios";
import { authConfig } from "../config/auth_config";

const API_URL = import.meta.env.VITE_API_URL
  ?? (import.meta.env.DEV ? "http://localhost:3001/api" : "https://dynamic-gym.onrender.com/api");

export const http = axios.create({ baseURL: API_URL });

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(authConfig.storageKey);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Cuando el servidor responde 401 (token vencido o ausente), limpia la sesión
// y redirige al login automáticamente desde cualquier página protegida.
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(authConfig.storageKey);
      if (!window.location.pathname.startsWith("/login")) {
        window.location.replace("/login");
      }
    }
    return Promise.reject(error);
  }
);
 