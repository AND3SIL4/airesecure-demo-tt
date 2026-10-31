import { FileX, SearchX } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAlertTypes, useZones } from '../../application/hooks/useCatalogs';
import { useIncidents } from '../../application/hooks/useIncidents';
import {
  clearIncidentFilters,
  hasActiveIncidentFilters,
  incidentFiltersToSearchParams,
  parseIncidentFilters,
  type IncidentFilters,
} from '../../domain/incidentFilters';
import { REPORT_PREVIEW_SIZE } from '../../domain/reports';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Skeleton } from '../components/Skeleton';
import { IncidentFilterBar } from '../features/incidents/IncidentFilterBar';
import { ExportCsvButton } from '../features/reports/ExportCsvButton';
import { ReportPreview } from '../features/reports/ReportPreview';

/** Reportes (doc 09 §3.9, solo supervisor): filtros de incidentes, vista previa de 10 filas y descarga CSV. */
export function ReportsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // La vista previa siempre es la primera página, aunque la URL traiga otra.
  const filters = useMemo<IncidentFilters>(() => ({ ...parseIncidentFilters(searchParams), page: 1 }), [searchParams]);

  const preview = useIncidents(filters, REPORT_PREVIEW_SIZE);
  const zones = useZones();
  const alertTypes = useAlertTypes();

  const setFilters = useCallback(
    (next: IncidentFilters) => setSearchParams(incidentFiltersToSearchParams({ ...next, page: 1 })),
    [setSearchParams],
  );

  const data = preview.data;
  const total = preview.isPlaceholderData ? undefined : data?.total;

  let content;
  if (preview.isPending) {
    content = <Skeleton variant="table" rows={REPORT_PREVIEW_SIZE} label="Cargando la vista previa…" />;
  } else if (preview.isError && !data) {
    content = (
      <ErrorState
        title="No se pudo cargar la vista previa"
        message={preview.error.message}
        onRetry={() => void preview.refetch()}
        retrying={preview.isFetching}
      />
    );
  } else if (!data || data.total === 0) {
    content = hasActiveIncidentFilters(filters) ? (
      <EmptyState
        icon={SearchX}
        title="Sin incidentes que coincidan"
        message="No hay incidentes para exportar con estos filtros. Prueba con otros o límpialos."
        actionLabel="Limpiar filtros"
        onAction={() => setFilters(clearIncidentFilters(filters))}
      />
    ) : (
      <EmptyState
        icon={FileX}
        title="Sin incidentes en los últimos 30 días"
        message="No hay incidentes para exportar. Se crean cuando una persona confirma una alerta."
      />
    );
  } else {
    content = (
      <div className={`transition-opacity duration-200 ${preview.isPlaceholderData ? 'opacity-60' : ''}`}>
        <ReportPreview
          incidents={data.items}
          total={data.total}
          sort={filters.sort}
          onSortChange={(sort) => setFilters({ ...filters, sort })}
          onOpen={(id) => navigate(`/incidentes/${encodeURIComponent(id)}`)}
        />
      </div>
    );
  }

  return (
    <section aria-labelledby="reports-title" className="space-y-4">
      <header>
        <h1 id="reports-title" className="text-2xl font-semibold text-slate-900">
          Reportes
        </h1>
        <p className="text-sm text-slate-600">
          Exporta el registro de incidentes a CSV (UTF-8, compatible con Excel) con fechas en hora de Bogotá.
        </p>
      </header>

      <IncidentFilterBar
        filters={filters}
        onChange={setFilters}
        zones={zones.data ?? []}
        alertTypes={alertTypes.data ?? []}
      />

      <Card title="Vista previa" actions={<ExportCsvButton filters={filters} total={total} failed={preview.isError} label="Descargar CSV" />}>
        <div aria-busy={preview.isFetching || undefined}>{content}</div>
      </Card>
    </section>
  );
}
