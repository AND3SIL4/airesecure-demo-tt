// Metadatos de UI de la severidad (doc 05 §4.1). El rojo solo se usa para `critica`.
// Los colores de texto usan variantes `-text` más oscuras para cumplir el contraste AA.
import type { RiskLevel, Severity } from './types';

export type SeverityIcon = 'octagon-alert' | 'triangle-alert' | 'circle-alert' | 'info' | 'circle-check';

export interface SeverityMeta {
  label: string;
  /** Clases de Tailwind para el badge (fondo suave, texto y borde). */
  colorClass: string;
  icon: SeverityIcon;
  order: number;
}

export const SEVERITY_META: Record<Severity, SeverityMeta> = {
  critica: {
    label: 'Crítica',
    colorClass: 'bg-sev-critica/10 text-sev-critica-text border-sev-critica/40',
    icon: 'octagon-alert',
    order: 4,
  },
  alta: {
    label: 'Alta',
    colorClass: 'bg-sev-alta/10 text-sev-alta-text border-sev-alta/40',
    icon: 'triangle-alert',
    order: 3,
  },
  media: {
    label: 'Media',
    colorClass: 'bg-sev-media/10 text-sev-media-text border-sev-media/40',
    icon: 'circle-alert',
    order: 2,
  },
  baja: {
    label: 'Baja',
    colorClass: 'bg-sev-baja/10 text-sev-baja border-sev-baja/40',
    icon: 'info',
    order: 1,
  },
};

export const RISK_LEVEL_META: Record<RiskLevel, SeverityMeta> = {
  ...SEVERITY_META,
  normal: {
    label: 'Normal',
    colorClass: 'bg-ok/10 text-ok-text border-ok/40',
    icon: 'circle-check',
    order: 0,
  },
};

export const SEVERITIES: readonly Severity[] = ['critica', 'alta', 'media', 'baja'];

/** Ordena de mayor a menor severidad. */
export function compareSeverity(a: Severity, b: Severity): number {
  return SEVERITY_META[b].order - SEVERITY_META[a].order;
}
