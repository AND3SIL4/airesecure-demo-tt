import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { resetDemo } from '../../infrastructure/api/demo';
import { resetSuccessMessage } from '../../domain/settings';
import { errorToastMessage } from '../errorMessage';
import { clearLocalReset, markLocalReset } from '../stores/demoReset';
import { clearNotifications } from '../stores/notifications';
import { clearToasts, toast } from '../stores/toasts';

/**
 * `POST /demo/reset`. El evento `demo.reset` limpia la caché y lleva al Resumen en todas las pestañas;
 * aquí se hace lo mismo por si el SSE no está conectado y se muestra el toast con los conteos.
 */
export function useResetDemo() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: resetDemo,
    onMutate: () => {
      markLocalReset();
    },
    onSuccess: (result) => {
      clearNotifications();
      clearToasts();
      void queryClient.invalidateQueries();
      void navigate('/', { replace: true });
      toast.success(resetSuccessMessage(result));
    },
    onError: (error) => {
      clearLocalReset();
      toast.error(errorToastMessage(error));
    },
  });
}
