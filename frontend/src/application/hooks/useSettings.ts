import { useQuery } from '@tanstack/react-query';
import type { Settings } from '../../domain/types';
import { getSettings } from '../../infrastructure/api/settings';
import { queryKeys } from '../queryKeys';

/** Margen tras la hora prevista del próximo evento antes de releer `nextRunAt`. */
const NEXT_RUN_MARGIN_MS = 1500;
const MIN_REFETCH_MS = 2000;
/** Sondeo mientras el simulador está en marcha pero aún no ha publicado `nextRunAt`. */
const PENDING_NEXT_RUN_POLL_MS = 3000;

/** Relee la configuración poco después del próximo tick para mantener la cuenta regresiva al día. */
function refetchAfterNextRun(settings: Settings | undefined): number | false {
  const simulator = settings?.simulator;
  if (!simulator?.enabled || !simulator.running) return false;
  if (!simulator.nextRunAt) return PENDING_NEXT_RUN_POLL_MS;
  const wait = new Date(simulator.nextRunAt).getTime() - Date.now() + NEXT_RUN_MARGIN_MS;
  return Math.max(MIN_REFETCH_MS, wait);
}

/** `GET /settings` (supervisor). `settings.updated` la invalida desde `useLiveEvents`. */
export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings.all,
    queryFn: getSettings,
    refetchInterval: (query) => refetchAfterNextRun(query.state.data),
  });
}
