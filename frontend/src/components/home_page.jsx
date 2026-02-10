import { useMemo } from "react";
import { MapPin, Phone, Dumbbell, Users , Instagram } from "lucide-react";
import Section from "../components/ui/Section";
import Hero from "../components/home/Hero";
import Carousel from "./ui/carrousel";
import { images } from "../assets/index.js";



export default function HomePage() {
  const slides = [
  {
    kicker: "Contacto",
    icon: <Phone size={16} />,
    title: "Estamos para ayudarte",
    highlight: "para lograr tus objetivo",
    subtitle: "Consultas, horarios y asesoramiento",
    image: images.heroGym1,
    points: [
      {
        icon: Phone,
        label: "WhatsApp",
        description: "Respuesta inmediata",
        href: "https://wa.me/543705023131",
        external: true,
      },
      {
        icon: MapPin,
        label: "Ver ubicación",
        description: "Vicente Posadas 1915, P3600 Formosa",
        href: "https://maps.app.goo.gl/QGhPwN8UxqWFzi7y6",
        external: true,
      },
      {
        icon: Instagram,
        label: "Instagram",
        description: "DYNAMIC GYM",
        href: "https://www.instagram.com/dynamic.gymm",
        external: true,
      },
    ],
  },
  {
    kicker: "Entrenamiento",
    icon: <Dumbbell size={16} />,
    title: "Planes profesionales",
    highlight: "para cada objetivo",
    image: images.heroGym2,
    points: [
      {
        icon: Users,
        label: "Clases guiadas",
        description: "Profesores certificados",
      },
      {
        icon: Dumbbell,
        label: "Fuerza y potencia",
        description: "Equipamiento moderno",
      },
    ],
  },
  

];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SECTION 2 - CAROUSEL */}
      <Section background="" containerClassName="py-10">
            <div className="text-center">
                <span className="inline-flex items-center rounded-full bg-green-700/60 px-4 py-1 text-4xl font-bold text-white">
                    Dynamic GYM
                </span>

                <h2 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
                    Un gimnasio pensado para
                    <span className="block text-green-600">superar tus límites</span>
                </h2>

                <p className="mt-4 text-gray-600 max-w-2xl font-semibold mx-auto text-base md:text-lg">
                    Profesores, clases y un espacio moderno diseñado para mejorar tu
                    rendimiento físico de forma real y sostenida.
                </p>
            </div>
            <div className="mt-6">
                <Carousel slides={slides} autoPlay intervalMs={6500} />
            </div>
      </Section>
    </div>
  );
}
