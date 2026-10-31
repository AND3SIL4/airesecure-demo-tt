import { lazy, Suspense } from 'react';
import { PageSkeleton } from '../components/PageSkeleton';

// Análisis usa Recharts: su fragmento (y vendor-charts) se descarga solo al entrar en /analisis (feature 009).
const AnalysisPage = lazy(() => import('./AnalysisPage').then((m) => ({ default: m.AnalysisPage })));

/** Ruta con carga diferida y un esqueleto mientras llega el fragmento de la vista. */
export function AnalysisRoute() {
  return (
    <Suspense fallback={<PageSkeleton label="Cargando el análisis…" />}>
      <AnalysisPage />
    </Suspense>
  );
}
