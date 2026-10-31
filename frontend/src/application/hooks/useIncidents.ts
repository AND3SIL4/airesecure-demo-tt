import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { INCIDENTS_PAGE_SIZE, type IncidentFilters } from '../../domain/incidentFilters';
import { getIncidents } from '../../infrastructure/api/incidents';
import { queryKeys } from '../queryKeys';

/** Registro paginado de incidentes; mantiene la página previa mientras llega la nueva. */
export function useIncidents(filters: IncidentFilters, pageSize: number = INCIDENTS_PAGE_SIZE) {
  return useQuery({
    queryKey: queryKeys.incidents.list(filters, pageSize),
    queryFn: () => getIncidents(filters, pageSize),
    placeholderData: keepPreviousData,
  });
}
