import { useQuery } from '@tanstack/react-query';
import { getIncidentsInCourseTotal } from '../../infrastructure/api/incidents';
import { queryKeys } from '../queryKeys';

/** Total de incidentes en curso para el badge del menú; lo invalidan los eventos en vivo. */
export function useIncidentCounts() {
  return useQuery({
    queryKey: queryKeys.incidents.counts,
    queryFn: getIncidentsInCourseTotal,
    staleTime: 30_000,
  });
}
