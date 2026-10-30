import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AlertActionBody, AlertDetail, ConfirmAlertResult, IncidentRef } from '../../domain/types';
import { postAlertAction } from '../../infrastructure/api/alerts';
import { ApiError } from '../../infrastructure/http';
import { errorToastMessage } from '../errorMessage';
import { queryKeys } from '../queryKeys';
import { toast } from '../stores/toasts';

export interface AlertActionOutcome {
  alert: AlertDetail;
  incident: IncidentRef | null;
}

function isConfirmResult(result: AlertDetail | ConfirmAlertResult): result is ConfirmAlertResult {
  return 'incident' in result && 'alert' in result;
}

function successMessage(alertId: string, body: AlertActionBody, incident: IncidentRef | null): string | null {
  switch (body.action) {
    case 'confirm':
      return incident
        ? `Alerta ${alertId} confirmada. Se creó el incidente ${incident.id}.`
        : `Alerta ${alertId} confirmada.`;
    case 'dismiss':
      return `Alerta ${alertId} descartada como falso positivo.`;
    case 'comment':
      return 'Comentario registrado.';
    case 'review':
      return null;
  }
}

/** Acciones humanas sobre una alerta: confirmar, descartar y comentar (y revisar). */
export function useAlertAction(alertId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: AlertActionBody): Promise<AlertActionOutcome> => {
      const result = await postAlertAction(alertId, body);
      return isConfirmResult(result) ? result : { alert: result, incident: null };
    },
    onSuccess: ({ alert, incident }, body) => {
      queryClient.setQueryData(queryKeys.alerts.detail(alertId), alert);
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.catalog.zones });
      const message = successMessage(alertId, body, incident);
      if (!message) return;
      toast.success(
        message,
        incident ? { action: { label: 'Ver incidente', to: `/incidentes/${incident.id}` } } : undefined,
      );
    },
    onError: (error) => {
      toast.error(errorToastMessage(error));
      if (error instanceof ApiError && error.status === 409) {
        // Otra persona actuó antes: se muestra el estado real.
        void queryClient.invalidateQueries({ queryKey: queryKeys.alerts.detail(alertId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.alerts.lists });
      }
    },
  });
}
