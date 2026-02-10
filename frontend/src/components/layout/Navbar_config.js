export const navConfig = {
  // =========================
  // Branding / textos
  // =========================
  brand: {
    titulo: "Dynamic Gym",         // texto principal
    subtitulo: "Dynamic",    // opcional (si querés mostrarlo)
    logoUrl: "",                  // ej: "/logo.png" (en /public/logo.png)
    mostrarTitulo: true,
    mostrarSubtitulo: false,
    linkTo: "/",                  // a dónde navega al tocar el logo
    fallbackLetter: "D",           // si no hay logo
  },

  // =========================
  // Links principales
  // =========================
 links: [
  { label: "Home", to: "/" },
  { label: "Ingreso", to: "/kiosk" },
  { label: "Login", to: "/login", ocultarSiAuth: true }, // ✅
  { label: "Registro", to: "/register" , requiereAuth: true },
],

// =========================
// Dropdown (ej: Admin / Usuario)
// =========================
dropdowns: [
  {
    id: "admin",
    labelNoAuth: "Admin",
    labelAuth: "Estadisicas",
    items: [
      { label: "Recaudación mensual", to: "/estadisticas/recaudaciones-mensual", requiereAuth: true, roles: ["admin"] },
      { label: "Alumnos nuevos", to: "/admin/estadisticas/alumnos-nuevos", requiereAuth: true, roles: ["admin"] },
      { label: "Vencimientos próximos", to: "/admin/estadisticas/vencimientos", requiereAuth: true, roles: ["admin"] },
      { label: "Asistencias (resumen)", to: "/admin/estadisticas/asistencias", requiereAuth: true, roles: ["admin"] },
      { label: "Asistencias por hora", to: "/admin/estadisticas/asistencias-horas", requiereAuth: true, roles: ["admin"] },
      { label: "Heatmap hora x día", to: "/admin/estadisticas/heatmap", requiereAuth: true, roles: ["admin"] },
    ],
  },
  //{
    //   id: "reportes",
    //   label: "Reportes",
    //   items: [
    //     { label: "Login", to: "/login" },
    //     { label: "Ingresos", to: "/admin/ingresos", requiereAuth: true, roles: ["admin"] },
    //   ],
    // },
],




  
  

  // =========================
  // Textos (labels del UI)
  // =========================
  labels: {
    menuAbrir: "Abrir menú",
    dropdownAbrir: "Abrir menú admin",
    seccionDropdownMobile: "Administración",
    botonSalir: "Logout",
  },

  // =========================
  // Layout / tamaños / look
  // =========================
  layout: {
    container: "max-w-6xl mx-auto px-4",
    altoBarra: "py-3",           // altura vertical del navbar
    gapLinks: "gap-2",
    anchoDropdown: "w-52",
    paddingDropdown: "p-2",
    radio: "rounded-xl",
    radioItem: "rounded-lg",
    sombra: "shadow-lg",
  },

  // =========================
  // Tema visual (colores y estados)
  // =========================
  theme: {
    navbar: { bg: "bg-emerald-700", border: "border-b border-emerald-800" },

    brand: {
    fallbackBg: "bg-white/20",
    fallbackText: "text-white",
    titleText: "text-white",
    subtitleText: "text-emerald-200",
    },

    // botón hamburguesa (mobile)
    hamburger: {
    bg: "bg-emerald-700",
    border: "border border-emerald-600",
    text: "text-white",
    hoverBg: "hover:bg-emerald-600",
    },

    // link normal (desktop + mobile)
    link: { text: "text-white", hoverBg: "hover:bg-emerald-600", hoverText: "" },

    // link activo (ruta actual)
    linkActive: { bg: "bg-white/20", text: "text-white" },

    // botón del dropdown (desktop)
    dropdownButton: { text: "text-white", hoverBg: "hover:bg-emerald-600", bg: "", border: "" },

    // panel dropdown
    dropdownPanel: { bg: "bg-emerald-700", border: "border border-emerald-600" },

    // item dropdown
    dropdownItem: { text: "text-white", hoverBg: "hover:bg-emerald-600" },

    // menú mobile desplegable
    mobileMenu: { bg: "bg-emerald-700", border: "border border-emerald-600" },

    // separador mobile
    divider: "border-t border-emerald-600",

    // logout
    logout: { text: "text-red-500", hoverBg: "hover:bg-red-500/20" },
  },
};
