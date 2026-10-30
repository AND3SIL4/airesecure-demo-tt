// Etiquetas legibles e iconos de las acciones de la timeline (doc 05, doc 09 §8).
import type { TimelineAction, TimelineEvent } from './types';

export type TimelineIcon =
  | 'sparkles'
  | 'eye'
  | 'check-circle'
  | 'x-circle'
  | 'message-square'
  | 'folder-plus'
  | 'users'
  | 'activity'
  | 'arrow-up-right'
  | 'check-check'
  | 'rotate-ccw'
  | 'play'
  | 'settings';

export interface TimelineActionMeta {
  label: string;
  icon: TimelineIcon;
}

export const TIMELINE_ACTION_META: Record<TimelineAction, TimelineActionMeta> = {
  created: { label: 'Alerta generada', icon: 'sparkles' },
  review: { label: 'Revisión iniciada', icon: 'eye' },
  confirm: { label: 'Alerta confirmada', icon: 'check-circle' },
  dismiss: { label: 'Descartada como falso positivo', icon: 'x-circle' },
  comment: { label: 'Comentario', icon: 'message-square' },
  incident_created: { label: 'Incidente creado', icon: 'folder-plus' },
  assign: { label: 'Equipo asignado', icon: 'users' },
  start: { label: 'Atención iniciada', icon: 'activity' },
  escalate: { label: 'Incidente escalado', icon: 'arrow-up-right' },
  resolve: { label: 'Incidente resuelto', icon: 'check-check' },
  demo_reset: { label: 'Demo reiniciada', icon: 'rotate-ccw' },
  scenario_triggered: { label: 'Escenario lanzado', icon: 'play' },
  settings_updated: { label: 'Configuración actualizada', icon: 'settings' },
};

const FALLBACK_META: TimelineActionMeta = { label: 'Evento registrado', icon: 'sparkles' };

export function timelineActionMeta(action: string): TimelineActionMeta {
  return (TIMELINE_ACTION_META as Record<string, TimelineActionMeta | undefined>)[action] ?? FALLBACK_META;
}

export const SYSTEM_ACTOR_LABEL = 'Sistema';

/** Último evento de una acción concreta (p. ej., quién descartó y cuándo). */
export function lastEventOf(events: readonly TimelineEvent[], action: TimelineAction): TimelineEvent | null {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i];
    if (event && event.action === action) return event;
  }
  return null;
}

/** Id del incidente referenciado en el payload de un evento, si lo hay. */
export function payloadIncidentId(event: TimelineEvent): string | null {
  const value = event.payload?.['incidentId'];
  return typeof value === 'string' ? value : null;
}
