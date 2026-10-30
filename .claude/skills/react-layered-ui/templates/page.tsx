// Plantilla: presentation/pages/AlertsPage.tsx — sin fetch; los 4 estados obligatorios
import { useSearchParams } from 'react-router-dom';
import { useAlerts } from '../../application/hooks/useAlerts';
import { parseAlertFilters } from '../../domain/filters';
import { FilterBar } from '../components/FilterBar';
import { AlertTable } from '../components/AlertTable';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';

export function AlertsPage() {
  const [params, setParams] = useSearchParams();
  const filters = parseAlertFilters(params);
  const page = Number(params.get('page') ?? 1);
  const { data, isLoading, isError, refetch } = useAlerts(filters, page);

  return (
    <section aria-labelledby="alerts-title" className="space-y-4">
      <h1 id="alerts-title" className="text-2xl font-semibold">Alertas</h1>
      <FilterBar value={filters} onChange={(next) => setParams(next)} />
      {isLoading && <Skeleton variant="table" rows={8} />}
      {isError && <ErrorState message="No se pudieron cargar las alertas." onRetry={() => refetch()} />}
      {data && data.items.length === 0 && (
        <EmptyState title="Sin alertas que coincidan" actionLabel="Limpiar filtros" onAction={() => setParams({})} />
      )}
      {data && data.items.length > 0 && <AlertTable page={data} />}
    </section>
  );
}
