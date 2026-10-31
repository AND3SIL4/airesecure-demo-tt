import { Skeleton } from './Skeleton';

export interface PageSkeletonProps {
  /** Texto para lectores de pantalla mientras llega el fragmento de la vista. */
  label: string;
}

/** Esqueleto genérico de una vista (título, tarjetas y bloque principal) para las rutas diferidas. */
export function PageSkeleton({ label }: PageSkeletonProps) {
  return (
    <div className="space-y-6">
      <Skeleton variant="text" rows={1} className="max-w-xs" label={label} />
      <div aria-hidden="true" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="h-24 rounded-lg bg-slate-200 motion-safe:animate-pulse" />
        <div className="h-24 rounded-lg bg-slate-200 motion-safe:animate-pulse" />
        <div className="hidden h-24 rounded-lg bg-slate-200 motion-safe:animate-pulse xl:block" />
      </div>
      <div aria-hidden="true" className="h-72 rounded-lg bg-slate-200 motion-safe:animate-pulse" />
    </div>
  );
}
