import { useQuery } from '@tanstack/react-query';
import { getActiveAlertsTotal } from '../../infrastructure/api/alerts';
import { queryKeys } from '../queryKeys';

/** Total de alertas pendientes para el badge del menú (research R9); lo invalidan los eventos en vivo. */
export function useAlertCounts() {
  return useQuery({
    queryKey: queryKeys.alerts.counts,
    queryFn: getActiveAlertsTotal,
    staleTime: 30_000,
  });
}
