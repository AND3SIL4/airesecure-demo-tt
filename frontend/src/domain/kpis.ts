// Definición de los 5 KPI del Resumen (doc 05 §6, doc 09 §3.2) y la semántica de su variación.
// La API entrega la variación en bruto (pct, abs o none); aquí se decide si subir es mejor o peor.
import { formatDuration } from './format';
import type { Delta, KpiKey } from './types';

export type KpiIcon = 'bell-ring' | 'octagon-alert' | 'folder-open' | 'check-check' | 'timer';

export interface KpiDefinition {
  key: KpiKey;
  label: string;
  icon: KpiIcon;
  /** Si es true, un aumento es negativo (más alertas o más tiempo de respuesta = peor). */
  higherIsWorse: boolean;
  /** Valor principal de la tarjeta. */
  format: (value: number | null) => string;
  /** Formato de una diferencia absoluta (sin signo). */
  formatDiff: (diff: number) => string;
}

const formatCount = (value: number | null): string =>
  value === null ? '—' : value.toLocaleString('es-CO', { maximumFractionDigits: 0 });

const formatMinutes = (value: number | null): string => {
  if (value === null) return '—';
  const minutes = value / 60;
  return `${minutes.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} min`;
};

export const KPI_DEFINITIONS: readonly KpiDefinition[] = [
  {
    key: 'activeAlerts',
    label: 'Alertas activas',
    icon: 'bell-ring',
    higherIsWorse: true,
    format: formatCount,
    formatDiff: (d) => formatCount(d),
  },
  {
    key: 'criticalAlerts',
    label: 'Críticas activas',
    icon: 'octagon-alert',
    higherIsWorse: true,
    format: formatCount,
    formatDiff: (d) => formatCount(d),
  },
  {
    key: 'openIncidents',
    label: 'Incidentes en curso',
    icon: 'folder-open',
    higherIsWorse: true,
    format: formatCount,
    formatDiff: (d) => formatCount(d),
  },
  {
    key: 'resolvedToday',
    label: 'Resueltos hoy',
    icon: 'check-check',
    higherIsWorse: false,
    format: formatCount,
    formatDiff: (d) => formatCount(d),
  },
  {
    key: 'avgResponseSecondsToday',
    label: 'Tiempo medio de respuesta (hoy)',
    icon: 'timer',
    higherIsWorse: true,
    format: formatMinutes,
    formatDiff: (d) => formatDuration(d),
  },
];

export type VariationDirection = 'up' | 'down' | 'flat' | 'none';
export type VariationTone = 'better' | 'worse' | 'neutral';

/** Variación lista para mostrar: flecha, tono semántico, texto visible y texto accesible. */
export interface KpiVariation {
  direction: VariationDirection;
  tone: VariationTone;
  text: string;
  srText: string;
}

const TONE_WORD: Record<VariationTone, string> = {
  better: 'mejor',
  worse: 'peor',
  neutral: 'sin cambios',
};

export const NO_PREVIOUS_DATA_TEXT = 'Sin datos de ayer';
export const NO_CURRENT_DATA_TEXT = 'Sin datos de hoy';

const NO_CURRENT_DATA: KpiVariation = {
  direction: 'none',
  tone: 'neutral',
  text: NO_CURRENT_DATA_TEXT,
  srText: 'Sin datos de hoy; no se puede comparar con ayer',
};

const NO_PREVIOUS_DATA: KpiVariation = {
  direction: 'none',
  tone: 'neutral',
  text: NO_PREVIOUS_DATA_TEXT,
  srText: 'Sin datos de ayer; no se puede comparar con hoy',
};

function formatPct(pct: number): string {
  return `${Math.abs(pct).toLocaleString('es-CO', { maximumFractionDigits: 1 })} %`;
}

function toneFor(direction: VariationDirection, higherIsWorse: boolean): VariationTone {
  if (direction === 'up') return higherIsWorse ? 'worse' : 'better';
  if (direction === 'down') return higherIsWorse ? 'better' : 'worse';
  return 'neutral';
}

/**
 * Traduce la variación de la API al texto de la tarjeta ("12 % más que ayer", "+3 vs ayer").
 * Sin dato de hoy: "Sin datos de hoy"; con dato de hoy pero sin el de ayer: "Sin datos de ayer".
 */
export function describeVariation(delta: Delta | undefined, def: KpiDefinition): KpiVariation {
  if (!delta) return NO_PREVIOUS_DATA;
  if (delta.value === null) return NO_CURRENT_DATA;
  if (delta.previous === null || delta.kind === 'none') return NO_PREVIOUS_DATA;
  const amount = delta.kind === 'pct' ? delta.pct : delta.diff;
  const direction: VariationDirection = amount > 0 ? 'up' : amount < 0 ? 'down' : 'flat';
  const tone = toneFor(direction, def.higherIsWorse);

  if (direction === 'flat') {
    return { direction, tone, text: 'Igual que ayer', srText: 'Igual que ayer' };
  }
  const sign = direction === 'up' ? '+' : '−';
  const moreLess = direction === 'up' ? 'más' : 'menos';
  if (delta.kind === 'pct') {
    const pct = formatPct(amount);
    return {
      direction,
      tone,
      text: `${sign}${pct} vs ayer`,
      srText: `${pct} ${moreLess} que ayer (${TONE_WORD[tone]})`,
    };
  }
  const diff = def.formatDiff(Math.abs(amount));
  return {
    direction,
    tone,
    text: `${sign}${diff} vs ayer`,
    srText: `${diff} ${moreLess} que ayer (${TONE_WORD[tone]})`,
  };
}
