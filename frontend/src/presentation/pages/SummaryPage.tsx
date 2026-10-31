import { CircleAlert, RefreshCw } from 'lucide-react';
import { useDashboard } from '../../application/hooks/useDashboard';
import { formatDateTime, formatHour } from '../../domain/format';
import { Button } from '../components/Button';
import { ErrorState } from '../components/ErrorState';
import { Skeleton } from '../components/Skeleton';
import { AnomaliesList } from '../features/summary/AnomaliesList';
import { CategoryDonut } from '../features/summary/CategoryDonut';
import { KpiRow } from '../features/summary/KpiRow';
import { PriorityAlerts } from '../features/summary/PriorityAlerts';
import { Trend24h } from '../features/summary/Trend24h';
import { ZoneMap } from '../features/summary/ZoneMap';

const BLOCK = 'rounded-lg bg-slate-200 motion-safe:animate-pulse';

function SummarySkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton rows={1} className="max-w-xs" label="Cargando el resumen…" />
      <div aria-hidden="true" className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className={`${BLOCK} h-32`} />
        ))}
      </div>
      <div aria-hidden="true" className="grid gap-4 lg:grid-cols-12">
        <div className={`${BLOCK} h-80 lg:col-span-7`} />
        <div className={`${BLOCK} h-80 lg:col-span-5`} />
      </div>
      <div aria-hidden="true" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className={`${BLOCK} h-72`} />
        <div className={`${BLOCK} h-72`} />
        <div className={`${BLOCK} h-72`} />
      </div>
    </div>
  );
}

/** Resumen operativo (doc 09 §3.2): KPIs, prioridades, mapa, categorías, tendencia y anomalías. */
export function SummaryPage() {
  const { data, isPending, error, refetch, isFetching, isRefetchError } = useDashboard();

  return (
    <section aria-labelledby="summary-title" className="space-y-4">
      <header>
        <h1 id="summary-title" className="text-2xl font-semibold text-slate-900">
          Resumen
        </h1>
        <p className="text-sm text-slate-600">
          Estado de la seguridad de la terminal en tiempo real. La IA prioriza; la decisión siempre es humana.
        </p>
        {data && (
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
            <span className="tabular">Actualizado: {formatDateTime(data.generatedAt)}.</span>
            <span role="status" className="inline-flex flex-wrap items-center gap-2">
              {isRefetchError && (
                <>
                  <span className="inline-flex items-center gap-1.5 text-sev-alta-text">
                    <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
                    <span className="tabular">
                      No se pudo actualizar; mostrando datos de las {formatHour(data.generatedAt)}
                    </span>
                  </span>
                  <Button variant="ghost" size="sm" icon={RefreshCw} loading={isFetching} onClick={() => void refetch()}>
                    Reintentar
                  </Button>
                </>
              )}
            </span>
          </div>
        )}
      </header>

      {data ? (
        <>
          <KpiRow kpis={data.kpis} deltas={data.deltas} />

          <div className="grid gap-4 lg:grid-cols-12">
            <PriorityAlerts alerts={data.topAlerts} className="lg:col-span-7" />
            <ZoneMap zones={data.zones} markers={data.activeAlertMarkers} className="lg:col-span-5" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <CategoryDonut items={data.byCategory7d} />
            <Trend24h points={data.trend24h} />
            <AnomaliesList anomalies={data.anomalies} className="md:col-span-2 xl:col-span-1" />
          </div>
        </>
      ) : isPending ? (
        <SummarySkeleton />
      ) : (
        <ErrorState
          title="No se pudo cargar el resumen"
          message={error?.message ?? 'Inténtalo de nuevo en unos segundos.'}
          onRetry={() => void refetch()}
          retrying={isFetching}
        />
      )}
    </section>
  );
}
