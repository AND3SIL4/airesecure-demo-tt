import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ALERTS_PAGE_SIZE, type AlertFilters } from '../../domain/alertFilters';
import { getAlerts } from '../../infrastructure/api/alerts';
import { queryKeys } from '../queryKeys';

/**
 * Lista paginada de alertas; mantiene la página previa mientras llega la nueva (sin parpadeo).
 * `pageSize` (1-100) permite pedir más filas, p. ej. todas las activas para el Mapa.
 */
export function useAlerts(filters: AlertFilters, pageSize: number = ALERTS_PAGE_SIZE) {
  return useQuery({
    queryKey: queryKeys.alerts.list(filters, pageSize),
    queryFn: () => getAlerts(filters, pageSize),
    placeholderData: keepPreviousData,
  });
}
