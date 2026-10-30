import { useQuery } from '@tanstack/react-query';
import { getAlertTypes, getDismissReasons, getSources, getTeams, getZones } from '../../infrastructure/api/catalog';
import { queryKeys } from '../queryKeys';

const CATALOG_STALE_MS = 5 * 60 * 1000;

/** Zonas con su riesgo actual (cambia con las alertas activas: se invalida tras cada acción). */
export function useZones() {
  return useQuery({ queryKey: queryKeys.catalog.zones, queryFn: getZones, staleTime: 30 * 1000 });
}

export function useAlertTypes() {
  return useQuery({ queryKey: queryKeys.catalog.alertTypes, queryFn: getAlertTypes, staleTime: CATALOG_STALE_MS });
}

/** Fuentes (cámaras, sensores y fuentes lógicas): `GET /sources`. */
export function useSources() {
  return useQuery({ queryKey: queryKeys.catalog.sources, queryFn: getSources, staleTime: CATALOG_STALE_MS });
}

export function useDismissReasons() {
  return useQuery({
    queryKey: queryKeys.catalog.dismissReasons,
    queryFn: getDismissReasons,
    staleTime: CATALOG_STALE_MS,
  });
}

export function useTeams() {
  return useQuery({ queryKey: queryKeys.catalog.teams, queryFn: getTeams, staleTime: CATALOG_STALE_MS });
}
