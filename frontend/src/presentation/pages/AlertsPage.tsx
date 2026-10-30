import { Plus, SearchX, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAlerts } from '../../application/hooks/useAlerts';
import { useAlertTypes, useSources, useZones } from '../../application/hooks/useCatalogs';
import { openReportEvent } from '../../application/stores/reportEvent';
import {
  ALERTS_PAGE_SIZE,
  clearAlertFilters,
  hasActiveFilters,
  parseAlertFilters,
  toSearchParams,
  type AlertFilters,
} from '../../domain/alertFilters';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { FilterBar } from '../components/FilterBar';
import { Pagination } from '../components/Pagination';
import { Skeleton } from '../components/Skeleton';
import { AlertTable } from '../features/alerts/AlertTable';

const HIGHLIGHT_PARAM = 'highlight';
const HIGHLIGHT_MS = 2000;

/** Lista priorizada de alertas (doc 09 §3.3): filtros en la URL, tabla, paginación y 4 estados. */
export function AlertsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseAlertFilters(searchParams), [searchParams]);
  const highlightId = searchParams.get(HIGHLIGHT_PARAM);

  const alerts = useAlerts(filters);
  const zones = useZones();
  const alertTypes = useAlertTypes();
  const sources = useSources();

  const setFilters = useCallback(
    (next: AlertFilters) => setSearchParams(toSearchParams(next)),
    [setSearchParams],
  );

  // El resaltado dura 2 s; después se retira de la URL sin añadir una entrada al historial.
  useEffect(() => {
    if (!highlightId) return;
    const timer = setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete(HIGHLIGHT_PARAM);
          return next;
        },
        { replace: true },
      );
    }, HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [highlightId, setSearchParams]);

  const filtered = hasActiveFilters(filters);
  const data = alerts.data;

  let content;
  if (alerts.isPending) {
    content = <Skeleton variant="table" rows={8} label="Cargando alertas…" />;
  } else if (alerts.isError && !data) {
    content = (
      <ErrorState
        title="No se pudieron cargar las alertas"
        message={alerts.error.message}
        onRetry={() => void alerts.refetch()}
        retrying={alerts.isFetching}
      />
    );
  } else if (!data || data.items.length === 0) {
    content = filtered ? (
      <EmptyState
        icon={SearchX}
        title="Sin alertas que coincidan"
        message="Prueba con otros filtros o límpialos para ver todas las alertas activas."
        actionLabel="Limpiar filtros"
        onAction={() => setFilters(clearAlertFilters(filters))}
      />
    ) : (
      <EmptyState
        icon={ShieldCheck}
        title="Sin alertas activas"
        message="No hay alertas nuevas ni en revisión. Las detecciones nuevas aparecerán aquí."
        actionLabel={filters.page > 1 ? 'Ir a la primera página' : undefined}
        onAction={filters.page > 1 ? () => setFilters({ ...filters, page: 1 }) : undefined}
      />
    );
  } else {
    content = (
      <div className={`space-y-3 transition-opacity duration-200 ${alerts.isPlaceholderData ? 'opacity-60' : ''}`}>
        <AlertTable
          alerts={data.items}
          sort={filters.sort}
          onSortChange={(sort) => setFilters({ ...filters, sort, page: 1 })}
          onOpen={(id) => navigate(`/alertas/${encodeURIComponent(id)}`)}
          highlightId={highlightId}
          caption={`Alertas ordenadas por prioridad. ${data.total} en total.`}
        />
        <Pagination
          page={data.page}
          pageSize={data.pageSize || ALERTS_PAGE_SIZE}
          total={data.total}
          onPageChange={(page) => setFilters({ ...filters, page })}
          itemLabel="alerta"
          itemsLabel="alertas"
        />
      </div>
    );
  }

  return (
    <section aria-labelledby="alerts-title" className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id="alerts-title" className="text-2xl font-semibold text-slate-900">
            Alertas
          </h1>
          <p className="text-sm text-slate-600">
            Priorizadas por score. La IA sugiere; la decisión siempre es humana.
          </p>
        </div>
        <Button icon={Plus} onClick={openReportEvent}>
          Reportar evento
        </Button>
      </header>

      <FilterBar
        filters={filters}
        onChange={setFilters}
        zones={zones.data ?? []}
        alertTypes={alertTypes.data ?? []}
        sources={sources.data ?? []}
      />

      <div aria-busy={alerts.isFetching || undefined}>{content}</div>
    </section>
  );
}
