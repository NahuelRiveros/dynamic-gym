import { images } from "../../assets/index.js";

export const navbar_config = {
  brand: {
    titulo: "Dynamic",
    subtitulo: "Dynamic",
    logoUrl: images.dynamicLogo,
    mostrarTitulo: true,
    mostrarSubtitulo: false,
    linkTo: "/",
    fallbackLetter: "D",
  },

  links: [
    { label: "Home", to: "/" },
    { label: "Ingreso", to: "/kiosk" },
    { label: "Login", to: "/login", ocultarSiAuth: true },
    { label: "Registro", to: "/register", requiereAuth: true },
    {
      label: "Registrar pago",
      to: "/admin/pagos/registrar",
      requiereAuth: true,
      roles: ["admin", "staff"],
    },
  ],

  dropdowns: [
    {
      id: "admin",
      labelNoAuth: "admin",
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
          roles: ["staff", "admin"],
        },
      ],
    },
    {
      id: "otros",
      labelNoAuth: "Otros",
      labelAuth: "Otros",
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
          label: "Editar plan de alumno",
          to: "/admin/alumnos/editar-plan",
          requiereAuth: true,
          roles: ["admin"],
        },
      ],
    },
  ],

  labels: {
    menuAbrir: "Abrir menú",
    dropdownAbrir: "Abrir menú admin",
    seccionDropdownMobile: "Administración",
    botonSalir: "Logout",
  },

  layout: {
    container: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
    altoBarra: "py-3",
    gapLinks: "gap-1",
    anchoDropdown: "w-60",
    paddingDropdown: "p-2",
    radio: "rounded-2xl",
    radioItem: "rounded-xl",
    sombra: "shadow-xl shadow-black/20",
  },

  theme: {
    navbar: {
      bg: "bg-[#0B0F1A]",
      border: "border-b border-white/10",
    },

    brand: {
      fallbackBg: "bg-cyan-400/15",
      fallbackText: "text-cyan-300",
      titleText: "text-white",
      subtitleText: "text-cyan-300/80",
    },

    hamburger: {
      bg: "bg-white/5",
      border: "border border-white/10",
      text: "text-cyan-300",
      hoverBg: "hover:bg-cyan-400/10",
    },

    link: {
      text: "text-slate-200",
      hoverBg: "hover:bg-white/5",
      hoverText: "hover:text-cyan-300",
    },

    linkActive: {
      bg: "bg-cyan-400/12",
      text: "text-cyan-300",
    },

    dropdownButton: {
      text: "text-slate-200",
      hoverBg: "hover:bg-white/5",
      bg: "",
      border: "border border-transparent hover:border-white/10",
    },

    dropdownPanel: {
      bg: "bg-[#0F172A]/95",
      border: "border border-white/10",
    },

    dropdownItem: {
      text: "text-slate-200",
      hoverBg: "hover:bg-cyan-400/10",
    },

    mobileMenu: {
      bg: "bg-[#0F172A]/95",
      border: "border border-white/10",
    },

    divider: "border-t border-white/10",

    logout: {
      text: "text-red-400",
      hoverBg: "hover:bg-red-500/10",
    },
  },
};