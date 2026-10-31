import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary } from '../../infrastructure/api/dashboard';
import { queryKeys } from '../queryKeys';

/** Resumen operativo: `useLiveEvents` invalida `dashboard.all` con cada evento de alertas e incidentes. */
export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard.summary,
    queryFn: getDashboardSummary,
    staleTime: 15_000,
    // Las ventanas "hoy" y "última hora" avanzan aunque no lleguen eventos.
    refetchInterval: 60_000,
  });
}
