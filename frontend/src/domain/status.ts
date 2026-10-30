// Etiquetas legibles de los estados de alerta e incidente (doc 05 §2-3) para StatusBadge.
// Las acciones permitidas se añadirán con las features 002 y 004.
import type { AlertStatus, IncidentStatus } from './types';

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
