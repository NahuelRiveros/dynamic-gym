import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/auth_context.jsx";

/**
 * Protege rutas según autenticación y roles.
 *
 * Uso:
 *   <ProtectedRoute>                        → solo requiere estar logueado
 *   <ProtectedRoute roles={["admin"]}>      → solo admins
 *   <ProtectedRoute roles={["admin","staff"]}> → admin o staff
 *
 * Comportamiento:
 *   - Cargando auth  → muestra spinner
 *   - Sin sesión     → redirige a /login
 *   - Sin rol        → redirige a / (home)
 *   - OK             → renderiza children
 */
export default function ProtectedRoute({ children, roles = [] }) {
  const { usuario, cargando, isAuth } = useAuth();

  // El contexto todavía está verificando el token → esperar
  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Verificando sesión...</span>
        </div>
      </div>
    );
  }

  // No hay sesión → ir a login
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  // Hay roles requeridos → verificar que el usuario tenga al menos uno
  if (roles.length > 0) {
    const rolesUsuario = usuario?.roles ?? [];
    const tieneAcceso = roles.some((r) => rolesUsuario.includes(r));

    if (!tieneAcceso) {
      // Autenticado pero sin permiso → ir al inicio
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
