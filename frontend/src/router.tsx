import { createBrowserRouter } from 'react-router-dom';
import { VIEW_TITLES } from './domain/navigation';
import { PublicLayout } from './presentation/layout/PublicLayout';
import { RequireActor } from './presentation/layout/RequireActor';
import { RequireSupervisor } from './presentation/layout/RequireSupervisor';
import { RootLayout } from './presentation/layout/RootLayout';
import { Shell } from './presentation/layout/Shell';
import { AlertDetailPage } from './presentation/pages/AlertDetailPage';
import { AlertsPage } from './presentation/pages/AlertsPage';
import { IncidentDetailPage } from './presentation/pages/IncidentDetailPage';
import { IncidentsPage } from './presentation/pages/IncidentsPage';
import { LoginPage } from './presentation/pages/LoginPage';
import { MapRoute } from './presentation/pages/MapRoute';
import { NotFoundPage } from './presentation/pages/NotFoundPage';
import { PlaceholderPage } from './presentation/pages/PlaceholderPage';
import { SummaryPage } from './presentation/pages/SummaryPage';

// Rutas según specs/001-fundacion/contracts/ui-routes.md.
// RootLayout envuelve todo para que el Toaster quede dentro del contexto del router (Link sin recarga).
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
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
              { index: true, element: <SummaryPage /> },
              { path: '/alertas', element: <AlertsPage /> },
              { path: '/alertas/:id', element: <AlertDetailPage /> },
              { path: '/incidentes', element: <IncidentsPage /> },
              { path: '/incidentes/:id', element: <IncidentDetailPage /> },
              // Carga diferida: Three.js va en un chunk aparte (plan R8).
              { path: '/mapa', element: <MapRoute /> },
              { path: '/analisis', element: <PlaceholderPage title={VIEW_TITLES.analysis} /> },
              {
                element: <RequireSupervisor />,
                children: [
                  { path: '/reportes', element: <PlaceholderPage title={VIEW_TITLES.reports} /> },
                  { path: '/configuracion', element: <PlaceholderPage title={VIEW_TITLES.settings} /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);
