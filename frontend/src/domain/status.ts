// Etiquetas legibles de los estados de alerta e incidente (doc 05 §2-3) para StatusBadge.
// Las acciones permitidas solo habilitan o deshabilitan botones; la validación real la hace el backend.
import type { AlertActionName, AlertStatus, IncidentStatus } from './types';

export type Status = AlertStatus | IncidentStatus;

export type StatusIcon =
  | 'sparkles'
  | 'eye'
  | 'check-circle'
  | 'x-circle'
  | 'folder-open'
  | 'activity'
  | 'arrow-up-right'
  | 'check-check';

export interface StatusMeta {
  label: string;
  icon: StatusIcon;
  colorClass: string;
  final: boolean;
}

export const ALERT_STATUS_META: Record<AlertStatus, StatusMeta> = {
  nueva: {
    label: 'Nueva',
    icon: 'sparkles',
    colorClass: 'bg-brand-600/10 text-brand-700 border-brand-600/30',
    final: false,
  },
  en_revision: {
    label: 'En revisión',
    icon: 'eye',
    colorClass: 'bg-sev-media/10 text-sev-media-text border-sev-media/40',
    final: false,
  },
  confirmada: {
    label: 'Confirmada',
    icon: 'check-circle',
    colorClass: 'bg-navy-900/10 text-navy-900 border-navy-900/30',
    final: true,
  },
  descartada: {
    label: 'Descartada',
    icon: 'x-circle',
    colorClass: 'bg-slate-100 text-slate-600 border-slate-300',
    final: true,
  },
};

export const INCIDENT_STATUS_META: Record<IncidentStatus, StatusMeta> = {
  abierto: {
    label: 'Abierto',
    icon: 'folder-open',
    colorClass: 'bg-brand-600/10 text-brand-700 border-brand-600/30',
    final: false,
  },
  en_atencion: {
    label: 'En atención',
    icon: 'activity',
    colorClass: 'bg-sev-media/10 text-sev-media-text border-sev-media/40',
    final: false,
  },
  escalado: {
    label: 'Escalado',
    icon: 'arrow-up-right',
    colorClass: 'bg-sev-alta/10 text-sev-alta-text border-sev-alta/40',
    final: false,
  },
  resuelto: {
    label: 'Resuelto',
    icon: 'check-check',
    colorClass: 'bg-ok/10 text-ok-text border-ok/40',
    final: true,
  },
};

export const STATUS_META: Record<Status, StatusMeta> = {
  ...ALERT_STATUS_META,
  ...INCIDENT_STATUS_META,
};

export const ALERT_STATUSES: readonly AlertStatus[] = ['nueva', 'en_revision', 'confirmada', 'descartada'];
export const INCIDENT_STATUSES: readonly IncidentStatus[] = ['abierto', 'en_atencion', 'escalado', 'resuelto'];

/** Estados de origen permitidos por acción (doc 05 §2). `comment` se permite en cualquier estado. */
const ALERT_ACTION_FROM: Record<AlertActionName, readonly AlertStatus[]> = {
  review: ['nueva'],
  confirm: ['nueva', 'en_revision'],
  dismiss: ['nueva', 'en_revision'],
  comment: ALERT_STATUSES,
};

const ALERT_ACTION_ORDER: readonly AlertActionName[] = ['review', 'confirm', 'dismiss', 'comment'];

export function allowedAlertActions(status: AlertStatus): AlertActionName[] {
  return ALERT_ACTION_ORDER.filter((action) => ALERT_ACTION_FROM[action].includes(status));
}

export function isActiveAlertStatus(status: AlertStatus): boolean {
  return status === 'nueva' || status === 'en_revision';
}
