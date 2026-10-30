import { createBrowserRouter } from 'react-router-dom';
import { VIEW_TITLES } from './domain/navigation';
import { PublicLayout } from './presentation/layout/PublicLayout';
import { RequireActor } from './presentation/layout/RequireActor';
import { RequireSupervisor } from './presentation/layout/RequireSupervisor';
import { RootLayout } from './presentation/layout/RootLayout';
import { Shell } from './presentation/layout/Shell';
import { AlertDetailPage } from './presentation/pages/AlertDetailPage';
import { AlertsPage } from './presentation/pages/AlertsPage';
import { LoginPage } from './presentation/pages/LoginPage';
import { NotFoundPage } from './presentation/pages/NotFoundPage';
import { PlaceholderPage } from './presentation/pages/PlaceholderPage';

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
              { index: true, element: <PlaceholderPage title={VIEW_TITLES.summary} showComponentPreview /> },
              { path: '/alertas', element: <AlertsPage /> },
              { path: '/alertas/:id', element: <AlertDetailPage /> },
              { path: '/incidentes', element: <PlaceholderPage title={VIEW_TITLES.incidents} /> },
              { path: '/incidentes/:id', element: <PlaceholderPage title={VIEW_TITLES.incidentDetail} /> },
              { path: '/mapa', element: <PlaceholderPage title={VIEW_TITLES.map} /> },
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
