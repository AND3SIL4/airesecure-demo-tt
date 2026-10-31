import { useQuery } from '@tanstack/react-query';
import { getIncident } from '../../infrastructure/api/incidents';
import { ApiError } from '../../infrastructure/http';
import { queryKeys } from '../queryKeys';

function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

/** Detalle de un incidente con la historia combinada. Los 404 no se reintentan (`isNotFound`). */
export function useIncident(id: string) {
  const query = useQuery({
    queryKey: queryKeys.incidents.detail(id),
    queryFn: () => getIncident(id),
    enabled: id !== '',
    retry: (failureCount, error) => !isNotFound(error) && failureCount < 1,
  });
  return { ...query, isNotFound: query.isError && isNotFound(query.error) };
}
