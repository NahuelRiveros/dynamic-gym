import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/auth_context.jsx";
import { nombreDeRol } from "../../auth/permisos.js";
import { cn } from "../../lib/cn.js";

function iniciales(nombre) {
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((palabra) => palabra[0]?.toUpperCase() ?? "")
    .join("");
}

/** Quién está usando el sistema y el botón para salir. `oscuro`: en la barra lateral. */
export default function TarjetaUsuario({ oscuro = false, compacta = false, onSalir }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  if (!usuario) return null;

  const nombre = [usuario.nombre, usuario.apellido].filter(Boolean).join(" ") || usuario.email || "Usuario";

  async function salir() {
    await logout();
    onSalir?.();
    navigate("/login");
  }

  return (
    <div className={cn("flex items-center gap-3", compacta && "flex-col gap-2")}>
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-sky-400 to-indigo-500 text-sm font-bold text-white"
      >
        {iniciales(nombre) || "?"}
      </span>
      <div className={cn("min-w-0 flex-1", compacta && "sr-only")}>
        <p className={cn("truncate text-sm font-semibold", oscuro ? "text-white" : "text-slate-900")}>{nombre}</p>
        <p className={cn("truncate text-xs", oscuro ? "text-slate-400" : "text-slate-500")}>{nombreDeRol(usuario)}</p>
      </div>
      <button
        type="button"
        onClick={salir}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
          oscuro ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-500 hover:bg-rose-50 hover:text-rose-600",
        )}
      >
        <LogOut aria-hidden="true" className="h-5 w-5" />
      </button>
    </div>
  );
}
