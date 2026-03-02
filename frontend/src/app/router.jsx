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
]);
