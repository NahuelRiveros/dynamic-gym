import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../components/layout/app_layout.jsx";
import ProtectedRoute from "../components/protected_route.jsx";
import { PANTALLAS } from "./pantallas.js";

import HomePage from "../pages/inicio/home_page.jsx";
import LandingPublica from "../pages/inicio/landing_publica.jsx";
import KioskPage from "../pages/kiosco/kiosk_page.jsx";
import LoginPage from "../pages/auth/login_page.jsx";
import RegisterAlumnoPage from "../pages/alumnos/registrar_alumno_page.jsx";
import RecaudacionAnualPage from "../pages/recaudacion/recaudacion_anual_page.jsx";
import RecaudacionMesPage from "../pages/recaudacion/recaudacion_mes_page.jsx";
import AlumnosNuevosPage from "../pages/estadisticas/alumnos_nuevos.jsx";
import VencimientosPage from "../pages/estadisticas/vencimientos_proximos.jsx";
import HeatmapAsistenciasPage from "../pages/estadisticas/heatmap_asistencias.jsx";
import ListaAlumnosPage from "../pages/alumnos/lista_alumnos_page.jsx";
import FichaAlumnoPage from "../pages/alumnos/ficha_alumno_page.jsx";
import RegistrarPagoPage from "../pages/pagos/registrar_pago_page.jsx";
import PlanesPage from "../pages/admin/planes_page.jsx";
import PersonalPage from "../pages/admin/personal_page.jsx";
import RecaudacionDiaPage from "../pages/recaudacion/recaudacion_dia_page.jsx";
import EditarPlanVigentePage from "../pages/admin/editar_plan_vigente_page.jsx";
import ConsultaPlanPage from "../pages/consulta/consulta_plan_page.jsx";
import SuscripcionPage from "../pages/admin/suscripcion_page.jsx";
import PagoExitosoPage from "../pages/suscripcion/pago_exitoso_page.jsx";
import PagoFallidoPage from "../pages/suscripcion/pago_fallido_page.jsx";
import PromocionesPage from "../pages/admin/promociones_page.jsx";
import GestionSuscripcionPage from "../pages/super_admin/gestion_suscripcion_page.jsx";
import AudioConfigPage from "../pages/admin/audio_config_page.jsx";
import VentasPage from "../pages/ventas/ventas_page.jsx";

// Qué componente muestra cada pantalla. La ruta y los roles salen de PANTALLAS (app/pantallas.js).
const COMPONENTES = {
  inicio: HomePage,
  paginaGimnasio: LandingPublica,
  login: LoginPage,
  consultaPlan: ConsultaPlanPage,
  pagoExitoso: PagoExitosoPage,
  pagoFallido: PagoFallidoPage,
  kiosco: KioskPage,
  alumnos: ListaAlumnosPage,
  detalleAlumno: FichaAlumnoPage,
  nuevoAlumno: RegisterAlumnoPage,
  cobrarPlan: RegistrarPagoPage,
  corregirPlan: EditarPlanVigentePage,
  ventas: VentasPage,
  recaudacion: RecaudacionAnualPage,
  recaudacionMes: RecaudacionMesPage,
  recaudacionDia: RecaudacionDiaPage,
  alumnosNuevos: AlumnosNuevosPage,
  vencimientos: VencimientosPage,
  horarios: HeatmapAsistenciasPage,
  planes: PlanesPage,
  personal: PersonalPage,
  promociones: PromocionesPage,
  volumenAvisos: AudioConfigPage,
  suscripcion: SuscripcionPage,
  suscripcionSistema: GestionSuscripcionPage,
};

function ruta([id, Componente]) {
  const { ruta: path, roles } = PANTALLAS[id];
  const pantalla = <Componente />;
  return {
    path,
    element: <AppLayout>{roles ? <ProtectedRoute roles={roles}>{pantalla}</ProtectedRoute> : pantalla}</AppLayout>,
  };
}

export const router = createBrowserRouter([
  ...Object.entries(COMPONENTES).map(ruta),
  // Una dirección que no existe muestra el inicio.
  { path: "*", element: <AppLayout><HomePage /></AppLayout> },
]);
