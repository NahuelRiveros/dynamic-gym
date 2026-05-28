import { images } from "../../assets/index.js";

export const navbar_config = {
  brand: {
    titulo: "Dynamic",
    subtitulo: "Dynamic Gym",
    logoUrl: images.dynamicLogo,
    mostrarTitulo: true,
    mostrarSubtitulo: false,
    linkTo: "/",
    fallbackLetter: "D",
  },

  labels: {
    menuAbrir: "Abrir menú",
    dropdownAbrir: "Abrir submenú",
    seccionDropdownMobile: "Administración",
    botonSalir: "Logout",
  },

  links: [
    { label: "Home",         to: "/" },
    { label: "Mi Plan",      to: "/consulta-plan",      ocultarSiAuth: true },
    { label: "Ingreso",      to: "/kiosk",               requiereAuth: true, roles: ["admin", "staff"] },
    { label: "Login",        to: "/login",               ocultarSiAuth: true },
    { label: "Registro",     to: "/register",            requiereAuth: true, roles: ["admin", "staff"] },
    {
      label: "Registrar pago",
      to: "/admin/pagos/registrar",
      requiereAuth: true,
      roles: ["admin", "staff"],
    },
  ],

  dropdowns: [
    {
      id: "estadisticas",
      labelNoAuth: "Estadísticas",
      labelAuth: "Estadísticas",
      items: [
        {
          label: "Recaudación mensual",
          to: "/estadisticas/recaudaciones-mensual",
          requiereAuth: true,
          roles: ["admin"],
        },
        {
          label: "Alumnos nuevos",
          to: "/admin/estadisticas/alumnos-nuevos",
          requiereAuth: true,
          roles: ["admin"],
        },
        {
          label: "Vencimientos próximos",
          to: "/admin/estadisticas/vencimientos",
          requiereAuth: true,
          roles: ["admin"],
        },
        {
          label: "Frecuencia horaria",
          to: "/admin/estadisticas/heatmap",
          requiereAuth: true,
          roles: ["admin"],
        },
        {
          label: "Listado de alumnos",
          to: "/admin/estadisticas/alumnos",
          requiereAuth: true,
          roles: ["admin", "staff"],
        },
      ],
    },
    {
      id: "admin",
      labelNoAuth: "Admin",
      labelAuth: "Admin",
      items: [
        {
          label: "Planes",
          to: "/admin/planesViews",
          requiereAuth: true,
          roles: ["admin"],
        },
        {
          label: "Personal",
          to: "/admin/staffManager",
          requiereAuth: true,
          roles: ["admin"],
        },
        {
          label: "Suscripción",
          to: "/admin/suscripcion",
          requiereAuth: true,
          roles: ["admin"],
        },
        {
          label: "Promociones",
          to: "/admin/promociones",
          requiereAuth: true,
          roles: ["admin"],
        },
        {
          label: "Editar plan de alumno",
          to: "/admin/alumnos/editar-plan",
          requiereAuth: true,
          roles: ["admin"],
        },
      ],
    },
  ],
};
