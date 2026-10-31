import { lazy, Suspense } from 'react';
import { PageSkeleton } from '../components/PageSkeleton';

// El Resumen usa Recharts: su fragmento (y vendor-charts) se descarga solo al entrar en / (feature 009).
const SummaryPage = lazy(() => import('./SummaryPage').then((m) => ({ default: m.SummaryPage })));

/** Ruta con carga diferida y un esqueleto mientras llega el fragmento de la vista. */
export function SummaryRoute() {
  return (
    <Suspense fallback={<PageSkeleton label="Cargando el resumen…" />}>
      <SummaryPage />
    </Suspense>
  );
}
