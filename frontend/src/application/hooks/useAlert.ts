import { useQuery } from '@tanstack/react-query';
import { getAlert } from '../../infrastructure/api/alerts';
import { ApiError } from '../../infrastructure/http';
import { queryKeys } from '../queryKeys';

function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

/** Detalle de una alerta. Los 404 no se reintentan y se exponen como `isNotFound`. */
export function useAlert(id: string) {
  const query = useQuery({
    queryKey: queryKeys.alerts.detail(id),
    queryFn: () => getAlert(id),
    enabled: id !== '',
    retry: (failureCount, error) => !isNotFound(error) && failureCount < 1,
  });
  return { ...query, isNotFound: query.isError && isNotFound(query.error) };
}
