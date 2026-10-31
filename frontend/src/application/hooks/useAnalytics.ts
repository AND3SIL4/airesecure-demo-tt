// Un hook por bloque de Análisis: cada uno con su query para aislar carga y errores (plan R4).
// `useLiveEvents` invalida `analytics.all` con los eventos de alertas e incidentes.
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { AnalyticsDays } from '../../domain/analytics';
import {
  getAlertOutcomes,
  getAnomalies,
  getIncidentsByType,
  getIncidentsByZone,
  getIncidentsTrend,
  getIncidentTimes,
} from '../../infrastructure/api/analytics';
import { queryKeys } from '../queryKeys';

const STALE_TIME = 30_000;

export function useIncidentsByZone(days: AnalyticsDays) {
  return useQuery({
    queryKey: queryKeys.analytics.byZone(days),
    queryFn: () => getIncidentsByZone(days),
    staleTime: STALE_TIME,
    placeholderData: keepPreviousData,
  });
}

export function useIncidentsByType(days: AnalyticsDays) {
  return useQuery({
    queryKey: queryKeys.analytics.byType(days),
    queryFn: () => getIncidentsByType(days),
    staleTime: STALE_TIME,
    placeholderData: keepPreviousData,
  });
}

export function useIncidentsTrend(days: AnalyticsDays) {
  return useQuery({
    queryKey: queryKeys.analytics.trend(days),
    queryFn: () => getIncidentsTrend(days),
    staleTime: STALE_TIME,
    placeholderData: keepPreviousData,
  });
}

export function useIncidentTimes(days: AnalyticsDays) {
  return useQuery({
    queryKey: queryKeys.analytics.times(days),
    queryFn: () => getIncidentTimes(days),
    staleTime: STALE_TIME,
    placeholderData: keepPreviousData,
  });
}

export function useAlertOutcomes(days: AnalyticsDays) {
  return useQuery({
    queryKey: queryKeys.analytics.outcomes(days),
    queryFn: () => getAlertOutcomes(days),
    staleTime: STALE_TIME,
    placeholderData: keepPreviousData,
  });
}

/** Anomalías vigentes (no dependen del rango); la ventana de la última hora avanza sola. */
export function useAnomalies() {
  return useQuery({
    queryKey: queryKeys.analytics.anomalies,
    queryFn: getAnomalies,
    staleTime: STALE_TIME,
    refetchInterval: 60_000,
  });
}
