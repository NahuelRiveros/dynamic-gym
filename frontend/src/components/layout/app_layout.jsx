import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./navbar.jsx";
import Footer from "./footer.jsx";
import GymAudioScheduler from "../gym_audio_scheduler.jsx";
import SuscripcionBanner from "../SuscripcionBanner.jsx";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);
  return null;
}

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <ScrollToTop />
      <Navbar />
      <SuscripcionBanner />
      <GymAudioScheduler />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
