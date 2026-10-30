import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import type { AlertDetail } from '../../domain/types';
import { postAlertAction } from '../../infrastructure/api/alerts';
import { ApiError } from '../../infrastructure/http';
import { queryKeys } from '../queryKeys';
import { toast } from '../stores/toasts';

/**
 * Al abrir una alerta `nueva`, envía `review` una sola vez por alerta (research R12).
 * El `useRef` evita el doble disparo de StrictMode. Un 409 (otra persona ya la revisó) se ignora.
 */
export function useAutoReview(alert: AlertDetail | undefined) {
  const queryClient = useQueryClient();
  const requested = useRef(new Set<string>());

  const { mutate } = useMutation({
    mutationFn: (id: string) => postAlertAction(id, { action: 'review' }),
    onSuccess: (result, id) => {
      const detail = 'incident' in result ? result.alert : result;
      queryClient.setQueryData(queryKeys.alerts.detail(id), detail);
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts.lists });
    },
    onError: (error, id) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts.detail(id) });
      if (error instanceof ApiError && error.status === 409) return;
      toast.error(error.message);
    },
  });

  const id = alert?.id;
  const status = alert?.status;

  useEffect(() => {
    if (!id || status !== 'nueva' || requested.current.has(id)) return;
    requested.current.add(id);
    mutate(id);
  }, [id, status, mutate]);
}
