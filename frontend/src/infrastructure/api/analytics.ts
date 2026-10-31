// Analítica de la API (specs/007-analisis-reportes/contracts/api-analytics.md). Sin estado, sobre http.ts.
import type { AnalyticsDays } from '../../domain/analytics';
import type {
  AlertOutcomes,
  AnalyticsTimes,
  Anomaly,
  CategoryCount,
  DailySeverityCount,
  ZoneCount,
} from '../../domain/types';
import { http } from '../http';

export function getIncidentsByZone(days: AnalyticsDays) {
  return http.get<ZoneCount[]>(`/analytics/by-zone?days=${days}`);
}

export function getIncidentsByType(days: AnalyticsDays) {
  return http.get<CategoryCount[]>(`/analytics/by-type?days=${days}`);
}

export function getIncidentsTrend(days: AnalyticsDays) {
  return http.get<DailySeverityCount[]>(`/analytics/trend?days=${days}`);
}

export function getIncidentTimes(days: AnalyticsDays) {
  return http.get<AnalyticsTimes>(`/analytics/times?days=${days}`);
}

export function getAlertOutcomes(days: AnalyticsDays) {
  return http.get<AlertOutcomes>(`/analytics/outcomes?days=${days}`);
}

export function getAnomalies() {
  return http.get<Anomaly[]>('/analytics/anomalies');
}
