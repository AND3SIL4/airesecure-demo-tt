import { useMutation, useQueryClient } from '@tanstack/react-query';
import { scenarioTriggeredMessage } from '../../domain/settings';
import { triggerScenario } from '../../infrastructure/api/demo';
import { errorToastMessage } from '../errorMessage';
import { queryKeys } from '../queryKeys';
import { toast } from '../stores/toasts';

/**
 * Dispara un escenario. Quien lo dispara ve esta confirmación; `useLiveEvents` omite su aviso
 * de "Nueva alerta" gracias a `triggeredBy` (plan R5).
 */
export function useTriggerScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scenarioId: string) => triggerScenario(scenarioId),
    onSuccess: (alert, scenarioId) => {
      queryClient.setQueryData(queryKeys.alerts.detail(alert.id), alert);
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts.lists });
      void queryClient.invalidateQueries({ queryKey: queryKeys.catalog.zones });
      toast.success(scenarioTriggeredMessage(scenarioId, alert.id), {
        action: { label: 'Ver alerta', to: `/alertas/${encodeURIComponent(alert.id)}` },
      });
    },
    onError: (error) => {
      toast.error(errorToastMessage(error));
    },
  });
}
