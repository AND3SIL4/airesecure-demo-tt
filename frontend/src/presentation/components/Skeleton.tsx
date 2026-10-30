export type SkeletonVariant = 'text' | 'card' | 'table';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  /** Líneas (text) o filas (table). */
  rows?: number;
  className?: string;
  label?: string;
}

const BLOCK = 'rounded bg-slate-200 motion-safe:animate-pulse';

export function Skeleton({ variant = 'text', rows = 3, className = '', label = 'Cargando…' }: SkeletonProps) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {variant === 'text' && (
        <div aria-hidden="true" className="space-y-2">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className={`${BLOCK} h-4 ${i === rows - 1 ? 'w-2/3' : 'w-full'}`} />
          ))}
        </div>
      )}
      {variant === 'card' && (
        <div aria-hidden="true" className="rounded-lg border border-slate-200 bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`${BLOCK} size-10 rounded-full`} />
            <div className="flex-1 space-y-2">
              <div className={`${BLOCK} h-4 w-1/2`} />
              <div className={`${BLOCK} h-3 w-1/3`} />
            </div>
          </div>
        </div>
      )}
      {variant === 'table' && (
        <div aria-hidden="true" className="overflow-hidden rounded-lg border border-slate-200 bg-surface">
          <div className="h-10 border-b border-slate-200 bg-slate-50" />
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-slate-100 px-4 py-3 last:border-0">
              <div className={`${BLOCK} h-4 w-20`} />
              <div className={`${BLOCK} h-4 flex-1`} />
              <div className={`${BLOCK} h-4 w-24`} />
              <div className={`${BLOCK} h-4 w-16`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
