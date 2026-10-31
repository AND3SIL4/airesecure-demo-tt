import { lazy, Suspense } from 'react';
import { PageSkeleton } from '../components/PageSkeleton';

// Reportes (solo supervisor) se descarga solo al entrar en /reportes (feature 009).
const ReportsPage = lazy(() => import('./ReportsPage').then((m) => ({ default: m.ReportsPage })));

/** Ruta con carga diferida y un esqueleto mientras llega el fragmento de la vista. */
export function ReportsRoute() {
  return (
    <Suspense fallback={<PageSkeleton label="Cargando los reportes…" />}>
      <ReportsPage />
    </Suspense>
  );
}
