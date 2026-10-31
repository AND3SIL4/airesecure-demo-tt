// Claves jerárquicas de TanStack Query.
import type { AlertFilters } from '../domain/alertFilters';
import type { AnalyticsDays } from '../domain/analytics';
import type { IncidentFilters } from '../domain/incidentFilters';

export const queryKeys = {
  catalog: {
    all: ['catalog'] as const,
    users: ['catalog', 'users'] as const,
    zones: ['catalog', 'zones'] as const,
    teams: ['catalog', 'teams'] as const,
    alertTypes: ['catalog', 'alertTypes'] as const,
    dismissReasons: ['catalog', 'dismissReasons'] as const,
    sources: ['catalog', 'sources'] as const,
  },
  alerts: {
    all: ['alerts'] as const,
    lists: ['alerts', 'list'] as const,
    list: (filters: AlertFilters, pageSize: number) => ['alerts', 'list', filters, pageSize] as const,
    detail: (id: string) => ['alerts', 'detail', id] as const,
    /** Total de alertas pendientes (nueva + en revisión) para el badge del menú. */
    counts: ['alerts', 'counts'] as const,
    /** Total de alertas críticas activas para el botón "Críticas (N)". */
    criticalCount: ['alerts', 'criticalCount'] as const,
  },
  incidents: {
    /** Incluye las listas, los detalles y `incidents.counts`. */
    all: ['incidents'] as const,
    lists: ['incidents', 'list'] as const,
    list: (filters: IncidentFilters, pageSize: number) => ['incidents', 'list', filters, pageSize] as const,
    detail: (id: string) => ['incidents', 'detail', id] as const,
    /** Total de incidentes en curso para el badge del menú. */
    counts: ['incidents', 'counts'] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    summary: ['dashboard', 'summary'] as const,
  },
  analytics: {
    /** Todos los bloques de Análisis; `useLiveEvents` lo invalida con los eventos de alertas e incidentes. */
    all: ['analytics'] as const,
    byZone: (days: AnalyticsDays) => ['analytics', 'byZone', days] as const,
    byType: (days: AnalyticsDays) => ['analytics', 'byType', days] as const,
    trend: (days: AnalyticsDays) => ['analytics', 'trend', days] as const,
    times: (days: AnalyticsDays) => ['analytics', 'times', days] as const,
    outcomes: (days: AnalyticsDays) => ['analytics', 'outcomes', days] as const,
    anomalies: ['analytics', 'anomalies'] as const,
  },
  settings: {
    all: ['settings'] as const,
  },
  demo: {
    /** Escenarios predefinidos E-1 a E-4. */
    scenarios: ['demo', 'scenarios'] as const,
  },
  me: (actorId: string | null) => ['me', actorId] as const,
};
