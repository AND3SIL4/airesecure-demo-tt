import { useQuery } from '@tanstack/react-query';
import { getUsers } from '../../infrastructure/api/catalog';
import { queryKeys } from '../queryKeys';

/** Catálogo de perfiles simulados (`GET /users`). */
export function useUsers() {
  return useQuery({
    queryKey: queryKeys.catalog.users,
    queryFn: getUsers,
    staleTime: 5 * 60 * 1000,
  });
}
