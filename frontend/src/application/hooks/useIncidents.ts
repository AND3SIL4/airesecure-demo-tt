import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { IncidentFilters } from '../../domain/incidentFilters';
import { getIncidents } from '../../infrastructure/api/incidents';
import { queryKeys } from '../queryKeys';

/** Registro paginado de incidentes; mantiene la página previa mientras llega la nueva. */
export function useIncidents(filters: IncidentFilters) {
  return useQuery({
    queryKey: queryKeys.incidents.list(filters),
    queryFn: () => getIncidents(filters),
    placeholderData: keepPreviousData,
  });
}
