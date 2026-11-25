import { images } from "../../assets/index.js";

/**
 * Motivos de la página pública (los datos de contacto están en config/gimnasio.js).
 * Cada uno es un disco que se suma a la barra al bajar, en este orden (barra_medidas.js).
 */
export const MOTIVOS = [
  {
    titulo: ["Profesores", "certificados"],
    texto: "Entrenadores con formación profesional que te guían de forma personalizada hacia tu objetivo.",
    imagen: images.maquinas3,
    alt: "Torres de poleas con respaldos azules y columnas de pesas",
  },
  {
    titulo: ["Equipamiento", "moderno"],
    texto: "Máquinas y pesos libres para trabajar cada grupo muscular con precisión.",
    imagen: images.maquinas1,
    alt: "Soporte con discos de goma negros y, atrás, máquinas azules",
  },
  {
    titulo: ["Comunidad", "que motiva"],
    texto: "Un ambiente con energía, donde cada compañero te impulsa a dar un poco más.",
    imagen: images.principal2,
    alt: "Bicicletas fijas sobre el césped sintético de la entrada",
  },
];
