// Claves jerárquicas de TanStack Query.
export const queryKeys = {
  catalog: {
    all: ['catalog'] as const,
    users: ['catalog', 'users'] as const,
    zones: ['catalog', 'zones'] as const,
    teams: ['catalog', 'teams'] as const,
    alertTypes: ['catalog', 'alertTypes'] as const,
    dismissReasons: ['catalog', 'dismissReasons'] as const,
  },
  me: (actorId: string | null) => ['me', actorId] as const,
};
