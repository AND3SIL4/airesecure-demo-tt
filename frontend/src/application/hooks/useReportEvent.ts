import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ManualAlertBody } from '../../domain/types';
import { postManualAlert } from '../../infrastructure/api/alerts';
import { errorToastMessage } from '../errorMessage';
import { queryKeys } from '../queryKeys';
import { toast } from '../stores/toasts';

/** Reporte manual de un evento (`POST /alerts`). Devuelve el detalle creado (con su id). */
export function useReportEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ManualAlertBody) => postManualAlert(body),
    onSuccess: (alert) => {
      queryClient.setQueryData(queryKeys.alerts.detail(alert.id), alert);
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts.lists });
      void queryClient.invalidateQueries({ queryKey: queryKeys.catalog.zones });
      toast.success(`Evento reportado como ${alert.id}`);
    },
    onError: (error) => {
      toast.error(errorToastMessage(error));
    },
  });
}
