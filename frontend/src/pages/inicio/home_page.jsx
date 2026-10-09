import { useAuth } from "../../auth/auth_context.jsx";
import InicioPanel from "./inicio_panel.jsx";
import LandingPublica from "./landing_publica.jsx";

/** Con sesión, los accesos rápidos a las tareas del día; sin sesión, el sitio web del gimnasio. */
export default function HomePage() {
  const { isAuth, cargando } = useAuth();
  // Mientras se verifica la sesión no se muestra ninguna: evita ver la publicidad un instante.
  if (cargando) return <div className="min-h-[calc(100dvh-4rem)]" />;
  return isAuth ? <InicioPanel /> : <LandingPublica />;
}
