import {
  CalendarClock,
  ClipboardList,
  Clock,
  Contact,
  CreditCard,
  Globe,
  KeyRound,
  LayoutDashboard,
  Megaphone,
  PencilLine,
  Receipt,
  ScanLine,
  ShoppingBag,
  TrendingUp,
  UserPlus,
  Users,
  Volume2,
  Wallet,
} from "lucide-react";

const RECEPCION = ["admin", "staff"];
const ADMIN = ["admin"];

/**
 * Única lista de pantallas: la usan el router (qué rol entra), el menú (qué ve cada uno) y el
 * encabezado (título de la página). Así un permiso no puede quedar distinto en dos lugares.
 * `roles` vacío = pública. `padre` = qué ítem del menú queda marcado en una pantalla de detalle.
 * `corto` = nombre para la barra inferior del celular, donde entra poco texto.
 * `descripcion` = qué se hace ahí, en pocas palabras (tarjetas del inicio del panel).
 * `sinFooter` = pantalla pública enfocada en una sola tarea (login, Mi Plan): sin el footer largo.
 */
export const PANTALLAS = {
  inicio:            { ruta: "/", titulo: "Accesos rápidos", icono: LayoutDashboard },
  // La página pública también desde el panel (con sesión "/" muestra las tareas del día).
  paginaGimnasio:    { ruta: "/gimnasio", titulo: "Sitio web", icono: Globe, descripcion: "Lo que ven los visitantes" },
  login:             { ruta: "/login", titulo: "Iniciar sesión", sinFooter: true },
  consultaPlan:      { ruta: "/consulta-plan", titulo: "Mi Plan", sinFooter: true },
  pagoExitoso:       { ruta: "/pago-exitoso", titulo: "Pago aprobado" },
  pagoFallido:       { ruta: "/pago-fallido", titulo: "Pago rechazado" },

  kiosco:            { ruta: "/kiosk", titulo: "Ingreso", icono: ScanLine, roles: RECEPCION, descripcion: "Registrar la entrada de los alumnos por DNI" },
  alumnos:           { ruta: "/admin/estadisticas/alumnos", titulo: "Alumnos", icono: Users, roles: RECEPCION, descripcion: "Buscar un alumno y ver su ficha" },
  detalleAlumno:     { ruta: "/admin/estadisticas/alumnos/:id", titulo: "Ficha del alumno", roles: RECEPCION, padre: "alumnos" },
  nuevoAlumno:       { ruta: "/register", titulo: "Nuevo alumno", icono: UserPlus, roles: RECEPCION, descripcion: "Dar de alta a un alumno nuevo" },
  cobrarPlan:        { ruta: "/admin/pagos/registrar", titulo: "Cobrar plan", corto: "Cobrar", icono: CreditCard, roles: RECEPCION, descripcion: "Cobrar o renovar el plan de un alumno" },
  corregirPlan:      { ruta: "/admin/alumnos/editar-plan", titulo: "Corregir plan", icono: PencilLine, roles: ADMIN, descripcion: "Ajustar fechas o ingresos de un plan" },

  ventas:            { ruta: "/admin/ventas", titulo: "Ventas", icono: ShoppingBag, roles: RECEPCION, descripcion: "Vender productos del mostrador" },
  recaudacion:       { ruta: "/estadisticas/recaudaciones-mensual", titulo: "Recaudación", icono: Wallet, roles: ADMIN, descripcion: "Lo cobrado por mes y por día" },
  recaudacionMes:    { ruta: "/estadisticas/recaudaciones/:anio/:mes", titulo: "Recaudación del mes", roles: ADMIN, padre: "recaudacion" },
  recaudacionDia:    { ruta: "/estadisticas/recaudaciones/:anio/:mes/:dia/detalle", titulo: "Recaudación del día", roles: ADMIN, padre: "recaudacion" },

  alumnosNuevos:     { ruta: "/admin/estadisticas/alumnos-nuevos", titulo: "Alumnos nuevos", icono: TrendingUp, roles: ADMIN, descripcion: "Altas del período" },
  vencimientos:      { ruta: "/admin/estadisticas/vencimientos", titulo: "Vencimientos próximos", icono: CalendarClock, roles: ADMIN, descripcion: "Planes que vencen en los próximos días" },
  horarios:          { ruta: "/admin/estadisticas/heatmap", titulo: "Horarios concurridos", icono: Clock, roles: ADMIN, descripcion: "Los días y horas con más gente" },

  planes:            { ruta: "/admin/planesViews", titulo: "Planes", icono: ClipboardList, roles: ADMIN, descripcion: "Crear y editar los planes y precios" },
  personal:          { ruta: "/admin/staffManager", titulo: "Personal", icono: Contact, roles: ADMIN, descripcion: "Usuarios del staff y sus contraseñas" },
  promociones:       { ruta: "/admin/promociones", titulo: "Promociones", icono: Megaphone, roles: ADMIN, descripcion: "Enviar mails a los alumnos" },
  volumenAvisos:     { ruta: "/admin/config-audio", titulo: "Volumen de avisos", icono: Volume2, roles: ADMIN, descripcion: "Sonido de los avisos de la recepción" },
  suscripcion:       { ruta: "/admin/suscripcion", titulo: "Suscripción", icono: Receipt, roles: ADMIN, descripcion: "Estado y pago del sistema" },

  suscripcionSistema: { ruta: "/super-admin/suscripcion", titulo: "Suscripción del sistema", icono: KeyRound, roles: ["super_admin"], descripcion: "Vencimiento de la suscripción del cliente" },
};

/** Menú del panel, agrupado por la tarea de cada uno en el día (no por cómo está hecho el sistema). */
export const MENU_PANEL = [
  { id: "principal", titulo: null, items: ["paginaGimnasio", "inicio"] },
  { id: "recepcion", titulo: "Recepción", items: ["kiosco", "alumnos", "nuevoAlumno", "cobrarPlan", "ventas", "corregirPlan"] },
  { id: "caja", titulo: "Caja", items: ["recaudacion"] },
  { id: "reportes", titulo: "Reportes", items: ["alumnosNuevos", "vencimientos", "horarios"] },
  { id: "gimnasio", titulo: "Gimnasio", items: ["planes", "personal", "promociones", "volumenAvisos", "suscripcion"] },
  { id: "sistema", titulo: "Sistema", items: ["suscripcionSistema"] },
];

/** Las tareas de todos los días, a un toque en el celular. El resto va en "Más". */
export const BARRA_INFERIOR = ["kiosco", "alumnos", "cobrarPlan"];
