import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../auth/auth_context.jsx";
import MarcoApp from "./marco_app.jsx";
import GymAudioScheduler from "../gym_audio_scheduler.jsx";
import SuscripcionBanner from "../SuscripcionBanner.jsx";
import AvisoServidor from "../sistema/aviso_servidor.jsx";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);
  return null;
}

export default function AppLayout({ children }) {
  const { isAuth } = useAuth();
  return (
    <MarcoApp>
      <ScrollToTop />
      <SuscripcionBanner />
      {/* Los avisos de audio son para la PC del gimnasio: un visitante no los ve ni los escucha. */}
      {isAuth && <GymAudioScheduler />}
      <AvisoServidor />
      {children}
    </MarcoApp>
  );
}
