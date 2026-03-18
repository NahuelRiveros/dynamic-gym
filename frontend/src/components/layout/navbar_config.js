export const navbar_config = {
  brand: {
    titulo: "Dynamic",
    subtitulo: "Dynamic",
    logoUrl: "/src/assets/dynamicLogo.png",
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
    { label: "Registrar pago", to: "/admin/pagos/registrar", requiereAuth: true, roles: ["admin", "staff"] }
  ],

  dropdowns: [
    {
      id: "admin",
      labelNoAuth: "admin",
      labelAuth: "Estadisticas",
      items: [
        { label: "Recaudación mensual", to: "/estadisticas/recaudaciones-mensual", requiereAuth: true, roles: ["admin"] },
        { label: "Alumnos nuevos", to: "/admin/estadisticas/alumnos-nuevos", requiereAuth: true, roles: ["admin"] },
        { label: "Vencimientos próximos", to: "/admin/estadisticas/vencimientos", requiereAuth: true, roles: ["admin"] },
        { label: "Frecuencia Horaria", to: "/admin/estadisticas/heatmap", requiereAuth: true, roles: ["admin"] },
        { label: "Listado de Alumnos", to: "/admin/estadisticas/alumnos", requiereAuth: true, roles: ["staff", "admin"] },
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
    container: "max-w-6xl mx-auto px-4",
    altoBarra: "py-3",
    gapLinks: "gap-2",
    anchoDropdown: "w-52",
    paddingDropdown: "p-2",
    radio: "rounded-xl",
    radioItem: "rounded-lg",
    sombra: "shadow-lg shadow-cyan-500/10",
  },

  theme: {
    navbar: { bg: "bg-[#0B0F1A]", border: "border-b border-cyan-400/20" },

    brand: {
      fallbackBg: "bg-cyan-400/20",
      fallbackText: "text-cyan-300",
      titleText: "text-white",
      subtitleText: "text-cyan-300",
    },

    hamburger: {
      bg: "bg-[#111827]",
      border: "border border-cyan-400/30",
      text: "text-cyan-300",
      hoverBg: "hover:bg-cyan-400/10",
    },

    link: {
      text: "text-slate-100",
      hoverBg: "hover:bg-cyan-400/10",
      hoverText: "hover:text-cyan-300",
    },

    linkActive: {
      bg: "bg-cyan-400/15",
      text: "text-cyan-300",
    },

    dropdownButton: {
      text: "text-slate-100",
      hoverBg: "hover:bg-cyan-400/10",
      bg: "",
      border: "border border-transparent hover:border-cyan-400/20",
    },

    dropdownPanel: {
      bg: "bg-[#111827]",
      border: "border border-cyan-400/20",
    },

    dropdownItem: {
      text: "text-slate-100",
      hoverBg: "hover:bg-cyan-400/10",
    },

    mobileMenu: {
      bg: "bg-[#111827]",
      border: "border border-cyan-400/20",
    },

    divider: "border-t border-cyan-400/20",

    logout: {
      text: "text-red-400",
      hoverBg: "hover:bg-red-500/10",
    },
  },
};