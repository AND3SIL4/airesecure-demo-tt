import { lazy, Suspense } from 'react';
import { PageSkeleton } from '../components/PageSkeleton';

// Configuración (solo supervisor) se descarga solo al entrar en /configuracion (feature 009).
const SettingsPage = lazy(() => import('./SettingsPage').then((m) => ({ default: m.SettingsPage })));

/** Ruta con carga diferida y un esqueleto mientras llega el fragmento de la vista. */
export function SettingsRoute() {
  return (
    <Suspense fallback={<PageSkeleton label="Cargando la configuración…" />}>
      <SettingsPage />
    </Suspense>
  );
}
