import { lazy, Suspense } from 'react';
import { Skeleton } from '../components/Skeleton';

// El Mapa (y Three.js) va en un chunk aparte: solo se descarga al entrar en /mapa (plan R8).
const MapPage = lazy(() => import('./MapPage').then((m) => ({ default: m.MapPage })));

/** Ruta /mapa con carga diferida y un esqueleto mientras llega el chunk del motor 3D. */
export function MapRoute() {
  return (
    <Suspense fallback={<Skeleton variant="card" label="Cargando el mapa…" />}>
      <MapPage />
    </Suspense>
  );
}
