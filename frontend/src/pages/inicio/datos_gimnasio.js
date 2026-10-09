import { Dumbbell, Flame, Users } from "lucide-react";
import { images } from "../../assets/index.js";

/** Contenido de la página pública (los datos de contacto están en config/gimnasio.js). */

export const MOTIVOS = [
  {
    icono: Users,
    titulo: "Profesores certificados",
    texto: "Entrenadores con formación profesional que te guían de forma personalizada hacia tu objetivo.",
    imagen: images.maquinas1,
  },
  {
    icono: Dumbbell,
    titulo: "Equipamiento moderno",
    texto: "Máquinas y pesos libres para trabajar cada grupo muscular con precisión.",
    imagen: images.maquinas2,
  },
  {
    icono: Flame,
    titulo: "Comunidad que motiva",
    texto: "Un ambiente con energía, donde cada compañero te impulsa a dar un poco más.",
    imagen: images.maquinas3,
  },
];

export const GALERIA = [
  { imagen: images.principal2, texto: "La sala completa, con zona de cardio" },
  { imagen: images.maquinas3, texto: "Máquinas guiadas" },
  { imagen: images.maquinas1, texto: "Poleas y discos" },
  { imagen: images.maquinas2, texto: "Zona de musculación" },
];
