import { FolderOpen, SearchX } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAlertTypes, useZones } from '../../application/hooks/useCatalogs';
import { useCurrentUser } from '../../application/hooks/useCurrentUser';
import { useIncidents } from '../../application/hooks/useIncidents';
import {
  INCIDENTS_PAGE_SIZE,
  clearIncidentFilters,
  hasActiveIncidentFilters,
  incidentFiltersToSearchParams,
  parseIncidentFilters,
  type IncidentFilters,
} from '../../domain/incidentFilters';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Pagination } from '../components/Pagination';
import { Skeleton } from '../components/Skeleton';
import { IncidentFilterBar } from '../features/incidents/IncidentFilterBar';
import { IncidentTable } from '../features/incidents/IncidentTable';
import { ExportCsvButton } from '../features/reports/ExportCsvButton';

/** Registro de incidentes (doc 09 §3.5): filtros en la URL, tabla ordenable, paginación y 4 estados. */
export function IncidentsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseIncidentFilters(searchParams), [searchParams]);

  const incidents = useIncidents(filters);
  const zones = useZones();
  const alertTypes = useAlertTypes();
  const { user } = useCurrentUser();
  const isSupervisor = user?.role === 'supervisor';

  const setFilters = useCallback(
    (next: IncidentFilters) => setSearchParams(incidentFiltersToSearchParams(next)),
    [setSearchParams],
  );

  const data = incidents.data;
  const filtered = hasActiveIncidentFilters(filters);

  let content;
  if (incidents.isPending) {
    content = <Skeleton variant="table" rows={8} label="Cargando incidentes…" />;
  } else if (incidents.isError && !data) {
    content = (
      <ErrorState
        title="No se pudieron cargar los incidentes"
        message={incidents.error.message}
        onRetry={() => void incidents.refetch()}
        retrying={incidents.isFetching}
      />
    );
  } else if (data && data.items.length === 0 && data.total > 0 && filters.page > 1) {
    // La página de la URL quedó fuera de rango (con o sin filtros): se ofrece volver a la primera.
    content = (
      <EmptyState
        icon={SearchX}
        title="Esta página no tiene incidentes"
        message={`Hay ${data.total} ${data.total === 1 ? 'incidente' : 'incidentes'} con estos criterios, pero no en la página ${filters.page}.`}
        actionLabel="Ir a la primera página"
        onAction={() => setFilters({ ...filters, page: 1 })}
      />
    );
  } else if (!data || data.items.length === 0) {
    content = filtered ? (
      <EmptyState
        icon={SearchX}
        title="Sin incidentes que coincidan"
        message="Prueba con otros filtros o límpialos para ver los incidentes de los últimos 30 días."
        actionLabel="Limpiar filtros"
        onAction={() => setFilters(clearIncidentFilters(filters))}
      />
    ) : (
      <EmptyState
        icon={FolderOpen}
        title="Sin incidentes en los últimos 30 días"
        message="Los incidentes se crean cuando una persona confirma una alerta."
        actionLabel={filters.page > 1 ? 'Ir a la primera página' : undefined}
        onAction={filters.page > 1 ? () => setFilters({ ...filters, page: 1 }) : undefined}
      />
    );
  } else {
    content = (
      <div className={`space-y-3 transition-opacity duration-200 ${incidents.isPlaceholderData ? 'opacity-60' : ''}`}>
        <IncidentTable
          incidents={data.items}
          sort={filters.sort}
          onSortChange={(sort) => setFilters({ ...filters, sort, page: 1 })}
          onOpen={(id) => navigate(`/incidentes/${encodeURIComponent(id)}`)}
          caption={`Registro de incidentes. ${data.total} en total.`}
        />
        <Pagination
          page={data.page}
          pageSize={data.pageSize || INCIDENTS_PAGE_SIZE}
          total={data.total}
          onPageChange={(page) => setFilters({ ...filters, page })}
          itemLabel="incidente"
          itemsLabel="incidentes"
        />
      </div>
    );
  }

  return (
    <section aria-labelledby="incidents-title" className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 id="incidents-title" className="text-2xl font-semibold text-slate-900">
            Incidentes
          </h1>
          <p className="text-sm text-slate-600">Casos confirmados por una persona</p>
        </div>
        {/* Solo supervisor (doc 09 §3.5): exporta todas las filas con los filtros activos. */}
        {isSupervisor && (
          <ExportCsvButton
            filters={filters}
            total={incidents.isPlaceholderData ? undefined : data?.total}
            failed={incidents.isError}
            label="Exportar CSV"
            variant="secondary"
          />
        )}
      </header>

      <IncidentFilterBar
        filters={filters}
        onChange={setFilters}
        zones={zones.data ?? []}
        alertTypes={alertTypes.data ?? []}
      />

      <div aria-busy={incidents.isFetching || undefined}>{content}</div>
    </section>
  );
}
