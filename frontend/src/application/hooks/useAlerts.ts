import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { AlertFilters } from '../../domain/alertFilters';
import { getAlerts } from '../../infrastructure/api/alerts';
import { queryKeys } from '../queryKeys';

/** Lista paginada de alertas; mantiene la página previa mientras llega la nueva (sin parpadeo). */
export function useAlerts(filters: AlertFilters) {
  return useQuery({
    queryKey: queryKeys.alerts.list(filters),
    queryFn: () => getAlerts(filters),
    placeholderData: keepPreviousData,
  });
}
