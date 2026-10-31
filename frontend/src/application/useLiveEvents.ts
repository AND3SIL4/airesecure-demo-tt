// Suscripción única a los eventos en vivo (research R8). Se monta una sola vez en el Shell.
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ALERT_STATUS_PARTICIPLE, type LiveEvent } from '../domain/liveEvents';
import type { AlertDetail } from '../domain/types';
import { connectLiveEvents } from '../infrastructure/sse';
import { queryKeys } from './queryKeys';
import { getActorId } from './stores/actor';
import { consumeLocalReset } from './stores/demoReset';
import { reportLiveStatus, resetLiveStatus } from './stores/liveStatus';
import {
  clearNotifications,
  isAlertViewActive,
  pushNotification,
  recordAlertArrival,
} from './stores/notifications';
import { clearToasts, toast } from './stores/toasts';

/** Los avisos se omiten para los cambios hechos por el perfil activo (los datos sí se invalidan). */
function isOwnEvent(actorId: string | null | undefined): boolean {
  return actorId != null && actorId === getActorId();
}

/** Ventana mínima entre dos refrescos de la analítica (agregados de días: no necesitan cada evento). */
const ANALYTICS_THROTTLE_MS = 10_000;
let analyticsLastRun = 0;
let analyticsTimer: ReturnType<typeof setTimeout> | null = null;

function runAnalyticsInvalidation(queryClient: QueryClient): void {
  analyticsLastRun = Date.now();
  // refetchType 'active' (por defecto): solo se relanzan las consultas de una vista Análisis montada.
  void queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all, refetchType: 'active' });
}

/** Throttle con disparo final: como mucho una invalidación cada 10 s y nunca se pierde el último cambio. */
function invalidateAnalytics(queryClient: QueryClient): void {
  if (analyticsTimer !== null) return;
  const wait = analyticsLastRun + ANALYTICS_THROTTLE_MS - Date.now();
  if (wait <= 0) {
    runAnalyticsInvalidation(queryClient);
    return;
  }
  analyticsTimer = setTimeout(() => {
    analyticsTimer = null;
    runAnalyticsInvalidation(queryClient);
  }, wait);
}

function cancelAnalyticsInvalidation(): void {
  if (analyticsTimer !== null) clearTimeout(analyticsTimer);
  analyticsTimer = null;
  analyticsLastRun = 0;
}

function invalidateAlertData(queryClient: QueryClient): void {
  // `alerts.all` incluye las listas, los detalles y `alerts.counts`.
  void queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.catalog.zones });
  void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  invalidateAnalytics(queryClient);
}

function handleEvent(event: LiveEvent, queryClient: QueryClient, goHome: () => void): void {
  switch (event.name) {
    case 'alert.created': {
      const alert = event.data;
      invalidateAlertData(queryClient);
      recordAlertArrival(alert.id);
      // Escenarios: `actorId` es null (Sistema) y `triggeredBy` identifica al supervisor, que ya ve su confirmación.
      if (isOwnEvent(alert.actorId) || isOwnEvent(alert.triggeredBy)) return;
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
      invalidateAnalytics(queryClient);
      return;
    case 'settings.updated':
      // El evento trae el estado completo: se aplica directamente (las demás pestañas se sincronizan).
      queryClient.setQueryData(queryKeys.settings.all, event.data);
      // Los umbrales también se muestran en el catálogo de tipos.
      void queryClient.invalidateQueries({ queryKey: queryKeys.catalog.alertTypes });
      return;
    case 'demo.reset':
      cancelAnalyticsInvalidation();
      queryClient.clear();
      clearNotifications();
      // Si el reinicio lo lanzó el perfil activo (o esta pestaña hace poco), se conserva el toast
      // con los conteos (useResetDemo). Se consume la marca local en cualquier caso.
      if (!consumeLocalReset() && !isOwnEvent(event.data.actorId)) clearToasts();
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
      cancelAnalyticsInvalidation();
      resetLiveStatus();
    };
  }, [queryClient, navigate]);
}
