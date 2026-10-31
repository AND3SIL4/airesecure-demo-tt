// Rangos de fechas reutilizables (presets + personalizado) y su resolución a un intervalo ISO para la API.
import { dateKeyToIso, toDisplayDateKey } from './format';

export const DATE_RANGES = ['hoy', '7d', '30d', 'custom'] as const;
export type DateRangePreset = (typeof DATE_RANGES)[number];
export const DEFAULT_DATE_RANGE: DateRangePreset = '30d';

export const DATE_RANGE_LABELS: Record<DateRangePreset, string> = {
  hoy: 'Hoy',
  '7d': '7 días',
  '30d': '30 días',
  custom: 'Personalizado',
};

export interface DateRangeValue {
  range: DateRangePreset;
  /** `YYYY-MM-DD` (America/Bogota); solo con `custom`. */
  from: string;
  to: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function isDateRangePreset(value: string | null): value is DateRangePreset {
  return value !== null && (DATE_RANGES as readonly string[]).includes(value);
}

/**
 * Intervalo ISO (UTC) para la API. Hoy = desde las 00:00 de Bogotá;
 * 7 y 30 días = ventana móvil hasta ahora; personalizado = días completos de Bogotá.
 */
export function resolveDateRange(value: DateRangeValue, now: Date = new Date()): { from?: string; to?: string } {
  switch (value.range) {
    case 'hoy':
      return { from: dateKeyToIso(toDisplayDateKey(now), 'start') };
    case '7d':
      return { from: new Date(now.getTime() - 7 * DAY_MS).toISOString() };
    case '30d':
      return { from: new Date(now.getTime() - 30 * DAY_MS).toISOString() };
    case 'custom': {
      const out: { from?: string; to?: string } = {};
      if (value.from) out.from = dateKeyToIso(value.from, 'start');
      if (value.to) out.to = dateKeyToIso(value.to, 'end');
      return out;
    }
  }
}
