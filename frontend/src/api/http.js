import axios from "axios";
import { authConfig } from "../config/auth_config";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001/api",
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(authConfig.storageKey);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
 