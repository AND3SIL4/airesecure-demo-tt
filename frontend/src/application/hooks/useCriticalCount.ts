import { useQuery } from '@tanstack/react-query';
import { getCriticalTotal } from '../../infrastructure/api/alerts';
import { queryKeys } from '../queryKeys';

/** Alertas críticas activas para "Críticas (N)"; vive bajo `alerts.all`, que invalidan los eventos en vivo. */
export function useCriticalCount() {
  return useQuery({
    queryKey: queryKeys.alerts.criticalCount,
    queryFn: getCriticalTotal,
    staleTime: 30_000,
  });
}
