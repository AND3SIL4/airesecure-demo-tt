import { useQuery } from '@tanstack/react-query';
import { getScenarios } from '../../infrastructure/api/demo';
import { queryKeys } from '../queryKeys';

/** Escenarios predefinidos E-1 a E-4 (`GET /demo/scenarios`, supervisor). No cambian durante la demo. */
export function useScenarios() {
  return useQuery({ queryKey: queryKeys.demo.scenarios, queryFn: getScenarios, staleTime: 5 * 60 * 1000 });
}
