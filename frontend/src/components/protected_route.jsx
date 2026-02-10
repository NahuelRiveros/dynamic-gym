import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { authMe } from "../api/auth_api.js";

export default function ProtectedRoute({ children }) {
  const [estado, setEstado] = useState("cargando");

  useEffect(() => {
    authMe()
      .then(() => setEstado("ok"))
      .catch(() => setEstado("no"));
  }, []);

  if (estado === "cargando") {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Cargando...
      </div>
    );
  }

  if (estado === "no") return <Navigate to="/login" replace />;
  return children;
}
