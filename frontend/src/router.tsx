import { createBrowserRouter } from 'react-router-dom';
import { PublicLayout } from './presentation/layout/PublicLayout';
import { RequireActor } from './presentation/layout/RequireActor';
import { RequireSupervisor } from './presentation/layout/RequireSupervisor';
import { RootLayout } from './presentation/layout/RootLayout';
import { Shell } from './presentation/layout/Shell';
import { AlertDetailPage } from './presentation/pages/AlertDetailPage';
import { AlertsPage } from './presentation/pages/AlertsPage';
import { AnalysisRoute } from './presentation/pages/AnalysisRoute';
import { IncidentDetailPage } from './presentation/pages/IncidentDetailPage';
import { IncidentsPage } from './presentation/pages/IncidentsPage';
import { LoginPage } from './presentation/pages/LoginPage';
import { MapRoute } from './presentation/pages/MapRoute';
import { NotFoundPage } from './presentation/pages/NotFoundPage';
import { ReportsRoute } from './presentation/pages/ReportsRoute';
import { RouteErrorPage } from './presentation/pages/RouteErrorPage';
import { SettingsRoute } from './presentation/pages/SettingsRoute';
import { SummaryRoute } from './presentation/pages/SummaryRoute';

// Rutas según specs/001-fundacion/contracts/ui-routes.md.
// RootLayout envuelve todo para que el Toaster quede dentro del contexto del router (Link sin recarga).
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorPage standalone />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      {
        element: <RequireActor />,
        children: [
          {
            element: <Shell />,
            children: [
              {
                // Los errores de una vista (p. ej., un fragmento diferido que no se descarga) se muestran dentro del Shell.
                errorElement: <RouteErrorPage />,
                children: [
                  // Carga diferida (feature 009): Resumen y Análisis llevan Recharts; Reportes y Configuración son solo de supervisor.
                  { index: true, element: <SummaryRoute /> },
                  { path: '/alertas', element: <AlertsPage /> },
                  { path: '/alertas/:id', element: <AlertDetailPage /> },
                  { path: '/incidentes', element: <IncidentsPage /> },
                  { path: '/incidentes/:id', element: <IncidentDetailPage /> },
                  // Carga diferida: Three.js va en un fragmento aparte (plan R8).
                  { path: '/mapa', element: <MapRoute /> },
                  { path: '/analisis', element: <AnalysisRoute /> },
                  {
                    element: <RequireSupervisor />,
                    children: [
                      { path: '/reportes', element: <ReportsRoute /> },
                      { path: '/configuracion', element: <SettingsRoute /> },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);
