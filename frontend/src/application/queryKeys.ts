// Claves jerárquicas de TanStack Query.
import type { AlertFilters } from '../domain/alertFilters';
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
    list: (filters: AlertFilters) => ['alerts', 'list', filters] as const,
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
    list: (filters: IncidentFilters) => ['incidents', 'list', filters] as const,
    detail: (id: string) => ['incidents', 'detail', id] as const,
    /** Total de incidentes en curso para el badge del menú. */
    counts: ['incidents', 'counts'] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    summary: ['dashboard', 'summary'] as const,
  },
  settings: {
    all: ['settings'] as const,
  },
  me: (actorId: string | null) => ['me', actorId] as const,
};
