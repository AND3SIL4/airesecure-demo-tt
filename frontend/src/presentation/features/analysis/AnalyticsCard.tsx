import { CircleAlert, Info, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ErrorState } from '../../components/ErrorState';
import { Tooltip } from '../../components/Tooltip';

/** Subconjunto del resultado de `useQuery` que necesita un bloque. */
export interface BlockQuery<T> {
  data: T | undefined;
  isPending: boolean;
  isFetching: boolean;
  isPlaceholderData?: boolean;
  error: Error | null;
  refetch: () => unknown;
}

export interface AnalyticsCardProps<T> {
  /** Título-pregunta del bloque. */
  title: string;
  /** Explicación de qué muestra (tooltip del icono de información). */
  hint: string;
  query: BlockQuery<T>;
  children: (data: T) => ReactNode;
  /** Alto aproximado del contenido para el skeleton. */
  skeletonClassName?: string;
  className?: string;
}

/**
 * Bloque de Análisis con su propio estado (doc 09 §3.8 y §4): skeleton mientras carga, error con
 * "Reintentar" sin afectar a los demás bloques y, con datos, el contenido (que gestiona su vacío).
 */
export function AnalyticsCard<T>({
  title,
  hint,
  query,
  children,
  skeletonClassName = 'h-64',
  className = '',
}: AnalyticsCardProps<T>) {
  const { data, isPending, isFetching, isPlaceholderData, error, refetch } = query;

  const info = (
    <Tooltip content={hint} side="bottom-end">
      <button
        type="button"
        aria-label={`Qué muestra: ${title}`}
        className="inline-flex size-7 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      >
        <Info aria-hidden="true" className="size-4" />
      </button>
    </Tooltip>
  );

  let body: ReactNode;
  if (data !== undefined) {
    body = (
      <>
        {error && !isFetching && (
          <p role="status" className="mb-2 flex flex-wrap items-center gap-2 text-xs text-sev-alta-text">
            <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
            No se pudo actualizar; se muestran los últimos datos.
            <Button variant="ghost" size="sm" icon={RefreshCw} onClick={() => void refetch()}>
              Reintentar
            </Button>
          </p>
        )}
        <div
          aria-busy={isFetching || undefined}
          className={`transition-opacity duration-200 ${isPlaceholderData ? 'opacity-60' : ''}`}
        >
          {children(data)}
        </div>
      </>
    );
  } else if (isPending) {
    body = (
      <div role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Cargando: {title}</span>
        <div aria-hidden="true" className={`w-full rounded-md bg-slate-200 motion-safe:animate-pulse ${skeletonClassName}`} />
      </div>
    );
  } else {
    body = (
      <ErrorState
        title="No se pudo cargar este bloque"
        message={error?.message ?? 'Inténtalo de nuevo en unos segundos.'}
        onRetry={() => void refetch()}
        retrying={isFetching}
        className="border-none px-2 py-6"
      />
    );
  }

  return (
    <Card title={title} actions={info} className={className}>
      {body}
    </Card>
  );
}
