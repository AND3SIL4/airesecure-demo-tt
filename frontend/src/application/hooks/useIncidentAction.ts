import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { IncidentActionBody, IncidentDetail } from '../../domain/types';
import { postIncidentAction } from '../../infrastructure/api/incidents';
import { ApiError } from '../../infrastructure/http';
import { errorToastMessage } from '../errorMessage';
import { queryKeys } from '../queryKeys';
import { toast } from '../stores/toasts';

/** Avisos del contrato (contracts/ui-incidents.md). */
function successMessage(incident: IncidentDetail, body: IncidentActionBody): string {
  switch (body.action) {
    case 'assign':
      return `Incidente ${incident.id} asignado a ${incident.team?.name ?? body.teamId}.`;
    case 'start':
      return 'Atención iniciada.';
    case 'escalate':
      return `Incidente escalado a ${incident.escalatedTo?.name ?? incident.team?.name ?? body.teamId}.`;
    case 'resolve':
      return `Incidente ${incident.id} resuelto.`;
    case 'comment':
      return 'Comentario registrado.';
  }
}

/** Acciones humanas sobre un incidente: asignar, atender, escalar, resolver y comentar. */
export function useIncidentAction(incidentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: IncidentActionBody) => postIncidentAction(incidentId, body),
    onSuccess: (incident, body) => {
      queryClient.setQueryData(queryKeys.incidents.detail(incidentId), incident);
      // El detalle ya está al día con la respuesta: solo se invalidan listas, contadores y vistas derivadas
      // (la alerta de origen muestra su incidente).
      void queryClient.invalidateQueries({
        queryKey: queryKeys.incidents.lists,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.incidents.counts,
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success(successMessage(incident, body));
    },
    onError: (error) => {
      toast.error(errorToastMessage(error));
      if (error instanceof ApiError && error.status === 409) {
        // Otra persona actuó antes: se muestra el estado real.
        void queryClient.invalidateQueries({
          queryKey: queryKeys.incidents.detail(incidentId),
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.incidents.lists,
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.incidents.counts,
        });
      }
    },
  });
}
