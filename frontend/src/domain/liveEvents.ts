// Eventos en tiempo real de `GET /api/stream` (doc 08 §3.7, specs/003-tiempo-real/contracts/api-realtime.md).
// Esta capa no importa nada fuera de domain.
import type { AlertStatus, AlertSummary, IncidentStatus, Settings } from './types';

export const LIVE_EVENT_NAMES = [
  'alert.created',
  'alert.updated',
  'incident.created',
  'incident.updated',
  'settings.updated',
  'demo.reset',
  'heartbeat',
] as const;

export type LiveEventName = (typeof LIVE_EVENT_NAMES)[number];

/** Perfil que originó el cambio; `null` = Sistema (simulador o escenario). */
export type LiveActorId = string | null;

/**
 * `triggeredBy`: supervisor que disparó el escenario (`actorId` sigue siendo null = Sistema); null en el resto.
 * Opcional por compatibilidad con emisores anteriores a 008.
 */
export type AlertCreatedEvent = AlertSummary & { actorId: LiveActorId; triggeredBy?: LiveActorId };

export interface AlertUpdatedEvent {
  id: string;
  status: AlertStatus;
  actorId: LiveActorId;
}

export interface IncidentCreatedEvent {
  id: string;
  alertId: string;
  actorId: LiveActorId;
}

export interface IncidentUpdatedEvent {
  id: string;
  status: IncidentStatus;
  actorId: LiveActorId;
}

/** Estado completo de la configuración tras el cambio (igual que `GET /settings`). */
export type SettingsUpdatedEvent = Settings;

export interface DemoResetEvent {
  resetAt: string;
  actorId?: LiveActorId;
}

export interface HeartbeatEvent {
  ts: string;
}

export interface LiveEventDataMap {
  'alert.created': AlertCreatedEvent;
  'alert.updated': AlertUpdatedEvent;
  'incident.created': IncidentCreatedEvent;
  'incident.updated': IncidentUpdatedEvent;
  'settings.updated': SettingsUpdatedEvent;
  'demo.reset': DemoResetEvent;
  heartbeat: HeartbeatEvent;
}

/** Unión discriminada por `name` para tratar los eventos con `switch`. */
export type LiveEvent = {
  [K in LiveEventName]: { name: K; data: LiveEventDataMap[K] };
}[LiveEventName];

/** Estado de la conexión en vivo. */
export type LiveStatus = 'connecting' | 'open' | 'reconnecting';

/** Estado legible para "La alerta {id} fue {estado} por otro usuario". */
export const ALERT_STATUS_PARTICIPLE: Record<AlertStatus, string> = {
  nueva: 'marcada como nueva',
  en_revision: 'puesta en revisión',
  confirmada: 'confirmada',
  descartada: 'descartada',
};
