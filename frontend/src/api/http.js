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

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginEndpoint = error?.config?.url?.includes("/auth/login");
    if (error?.response?.status === 401 && !isLoginEndpoint) {
      localStorage.removeItem(authConfig.storageKey);
      if (!window.location.pathname.startsWith("/login")) {
        const from = encodeURIComponent(window.location.pathname);
        window.location.replace(`/login?expired=1&from=${from}`);
      }
    }
    return Promise.reject(error);
  }
);
 