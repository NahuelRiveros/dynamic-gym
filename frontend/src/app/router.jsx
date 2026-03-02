import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../components/layout/app_layout.jsx";
import ProtectedRoute from "../components/protected_route.jsx";


import HomePage from "../components/home_page.jsx";
import KioskPage from "../pages/kiosk_page.jsx";
import LoginPage from "../pages/login_page.jsx";
import RegisterAlumnoPage from "../pages/register_page.jsx";
import RecaudacionCalendario from "../pages/estadisticas/recaudaciones_mensual_page.jsx";
import RecaudacionCalendarioDia from "../pages/estadisticas/recaudacion_mes_page.jsx";
import AlumnosNuevosPage from "../pages/estadisticas/alumnos_nuevos.jsx";
import VencimientosPage from "../pages/estadisticas/vencimientos_proximos.jsx";
import HeatmapAsistenciasPage from "../pages/estadisticas/heatmap_asistencias.jsx"
import ListaAlumnosPage from "../pages/estadisticas/lista_alumnos.jsx";
import DetalleAlumnoPage from "../pages/estadisticas/detalle_alumno.jsx";
import RegistrarPagoPage from "../pages/registrar_pago.jsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AppLayout>
        <HomePage />
      </AppLayout>
    ),
  },
  {
    path: "/kiosk",
    element: (
      <AppLayout>
        <KioskPage />
      </AppLayout>
    ),
  },
  {
    path: "/login",
    element: (
      <AppLayout>
        <LoginPage />
      </AppLayout>
    ),
  },
  {
    path: "/register",
    element: (
      <AppLayout>
        <RegisterAlumnoPage />
      </AppLayout>
    ),
  },

  //ESTADISTICAS
  {
    path: "/estadisticas/recaudaciones-mensual",
    element: (
      <AppLayout>
        <ProtectedRoute roles={["admin"]}>
          <RecaudacionCalendario />
        </ProtectedRoute>
      </AppLayout>
    ),
  },
  {
    path: "/estadisticas/recaudaciones/:anio/:mes",
    element: (
      <AppLayout>
        <ProtectedRoute>
          <RecaudacionCalendarioDia />
        </ProtectedRoute>
      </AppLayout>
    ),
  },
    {
    path: "/admin/estadisticas/alumnos-nuevos",
    element: (
      <AppLayout>
        <ProtectedRoute roles={["admin"]}>
          <AlumnosNuevosPage />
        </ProtectedRoute>
      </AppLayout>
    ),
  },
  {
    path: "/admin/estadisticas/vencimientos",
    element: (
      <AppLayout>
        <ProtectedRoute roles={["admin"]}>
          <VencimientosPage />
        </ProtectedRoute>
      </AppLayout>
    ),
  },
  {
    path: "/admin/estadisticas/heatmap",
    element: (
      <AppLayout>
        <ProtectedRoute roles={["admin"]}>
          <HeatmapAsistenciasPage />
        </ProtectedRoute>
      </AppLayout>
    ),
  },
  {
  path: "/admin/estadisticas/alumnos",
  element: (
    <AppLayout>
      <ProtectedRoute roles={["admin", "staff"]}>
        <ListaAlumnosPage />
      </ProtectedRoute>
    </AppLayout>
  ),
},
{
    path: "/admin/estadisticas/alumnos/:id",
    element: (
      <AppLayout>
        <ProtectedRoute roles={["admin", "staff"]}>
          <DetalleAlumnoPage />
        </ProtectedRoute>
      </AppLayout>
    ),
  },
  {
  path: "/admin/pagos/registrar",
  element: (
    <AppLayout>
      <ProtectedRoute roles={["admin", "staff"]}>
        <RegistrarPagoPage />
      </ProtectedRoute>
    </AppLayout>
  ),
},
  
]);
