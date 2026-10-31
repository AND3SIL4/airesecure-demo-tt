import { useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsUpdatedMessage } from '../../domain/settings';
import type { SettingsUpdate } from '../../domain/types';
import { putSettings } from '../../infrastructure/api/settings';
import { errorToastMessage } from '../errorMessage';
import { queryKeys } from '../queryKeys';
import { toast } from '../stores/toasts';

/** `PUT /settings` parcial: guarda el estado devuelto y refresca el catálogo de tipos (umbrales). */
export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SettingsUpdate) => putSettings(body),
    onSuccess: (settings, body) => {
      queryClient.setQueryData(queryKeys.settings.all, settings);
      if (body.thresholds) void queryClient.invalidateQueries({ queryKey: queryKeys.catalog.alertTypes });
      toast.success(settingsUpdatedMessage(body));
    },
    onError: (error) => {
      toast.error(errorToastMessage(error));
    },
  });
}
