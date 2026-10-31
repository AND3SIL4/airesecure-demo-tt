// Suscripción única a los eventos en vivo (research R8). Se monta una sola vez en el Shell.
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ALERT_STATUS_PARTICIPLE, type LiveEvent } from '../domain/liveEvents';
import type { AlertDetail } from '../domain/types';
import { connectLiveEvents } from '../infrastructure/sse';
import { queryKeys } from './queryKeys';
import { getActorId } from './stores/actor';
import { reportLiveStatus, resetLiveStatus } from './stores/liveStatus';
import {
  clearNotifications,
  isAlertViewActive,
  pushNotification,
  recordAlertArrival,
} from './stores/notifications';
import { clearToasts, toast } from './stores/toasts';

/** Los avisos se omiten para los cambios hechos por el perfil activo (los datos sí se invalidan). */
function isOwnEvent(actorId: string | null): boolean {
  return actorId !== null && actorId === getActorId();
}

function invalidateAlertData(queryClient: QueryClient): void {
  // `alerts.all` incluye las listas, los detalles y `alerts.counts`.
  void queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.catalog.zones });
  void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
}

function handleEvent(event: LiveEvent, queryClient: QueryClient, goHome: () => void): void {
  switch (event.name) {
    case 'alert.created': {
      const alert = event.data;
      invalidateAlertData(queryClient);
      recordAlertArrival(alert.id);
      if (isOwnEvent(alert.actorId)) return;
      pushNotification({
        id: alert.id,
        severity: alert.severity,
        typeName: alert.type.name,
        zoneName: alert.zone.name,
        detectedAt: alert.detectedAt,
      });
      const message = `Nueva alerta: ${alert.type.name} · ${alert.zone.name}`;
      if (alert.severity === 'critica') {
        toast.info(message, {
          severity: alert.severity,
          persistent: true,
          assertive: true,
          action: { label: 'Ver alerta', to: `/alertas/${encodeURIComponent(alert.id)}` },
        });
      } else {
        toast.info(message, { severity: alert.severity });
      }
      return;
    }
    case 'alert.updated': {
      const { id, status, actorId } = event.data;
      const previous = queryClient.getQueryData<AlertDetail>(queryKeys.alerts.detail(id));
      invalidateAlertData(queryClient);
      // Solo se avisa si cambió el estado (un comentario no lo cambia) y lo hizo otra persona.
      if (!isOwnEvent(actorId) && isAlertViewActive(id) && previous && previous.status !== status) {
        toast.info(`La alerta ${id} fue ${ALERT_STATUS_PARTICIPLE[status]} por otro usuario`);
      }
      return;
    }
    case 'incident.created':
    case 'incident.updated':
      // `incidents.all` incluye las listas, los detalles y `incidents.counts` (badge del menú).
      void queryClient.invalidateQueries({ queryKey: queryKeys.incidents.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      return;
    case 'settings.updated':
      void queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
      return;
    case 'demo.reset':
      queryClient.clear();
      clearNotifications();
      clearToasts();
      goHome();
      return;
    case 'heartbeat':
      return;
  }
}

/** Abre el stream, traduce cada evento a invalidaciones y avisos, y publica el estado de la conexión. */
export function useLiveEvents(): void {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const goHome = () => {
      void navigate('/', { replace: true });
    };
    const close = connectLiveEvents({
      onEvent: (event) => handleEvent(event, queryClient, goHome),
      onStatus: (status) => {
        // Se pudieron perder eventos durante el corte: refresco general al reconectar.
        if (reportLiveStatus(status)) void queryClient.invalidateQueries();
      },
    });
    return () => {
      close();
      resetLiveStatus();
    };
  }, [queryClient, navigate]);
}
