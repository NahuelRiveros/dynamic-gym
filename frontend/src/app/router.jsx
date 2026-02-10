import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import ProtectedRoute from "../components/ProtectedRoute";

import HomePage from "../components/HomePage.jsx";
import KioskPage from "../pages/KioskPage";
import LoginPage from "../pages/LoginPage.jsx";
import RegisterAlumnoPage from "../pages/registerPage.jsx";
import RecaudacionMensual from "../pages/estadisticas/RecaudacionesMensualPage.jsx";
import RecaudacionMesPage from "../pages/estadisticas/RecaudacionMesPage.jsx";

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
  {
    path: "/estadisticas/recaudaciones-mensual",
    element: (
      <AppLayout>
        <ProtectedRoute roles={["admin"]}>
          <RecaudacionMensual />
        </ProtectedRoute>
      </AppLayout>
    ),
  },
  {
    path: "/estadisticas/recaudaciones/:anio/:mes",
    element: (
      <AppLayout>
        <ProtectedRoute>
          <RecaudacionMesPage />
        </ProtectedRoute>
      </AppLayout>
    ),
  },
]);
