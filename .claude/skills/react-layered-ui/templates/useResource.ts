// Plantilla: application/hooks/useAlerts.ts — casos de uso con TanStack Query
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAlerts, postAlertAction } from '../../infrastructure/api/alerts';
import { queryKeys } from '../queryKeys';
import { useToasts } from '../stores/toasts';
import type { AlertActionBody, AlertFilters } from '../../domain/types';

export function useAlerts(filters: AlertFilters, page: number) {
  return useQuery({
    queryKey: queryKeys.alerts.list(filters, page),
    queryFn: () => getAlerts(filters, page),
    placeholderData: (prev) => prev,
  });
}

export function useAlertAction(alertId: string) {
  const qc = useQueryClient();
  const toast = useToasts();
  return useMutation({
    mutationFn: (body: AlertActionBody) => postAlertAction(alertId, body),
    onSuccess: (_data, body) => {
      qc.invalidateQueries({ queryKey: queryKeys.alerts.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success(successMessage(body.action, alertId));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

function successMessage(action: AlertActionBody['action'], id: string): string {
  switch (action) {
    case 'confirm': return `Alerta ${id} confirmada. Se creó el incidente.`;
    case 'dismiss': return `Alerta ${id} descartada como falso positivo.`;
    case 'comment': return 'Comentario registrado.';
    default: return 'Acción registrada.';
  }
}
