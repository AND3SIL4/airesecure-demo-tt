// Claves jerárquicas de TanStack Query.
import type { AlertFilters } from '../domain/alertFilters';

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
  },
  incidents: {
    all: ['incidents'] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
  },
  settings: {
    all: ['settings'] as const,
  },
  me: (actorId: string | null) => ['me', actorId] as const,
};
