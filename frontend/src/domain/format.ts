// Formato de fechas: la API entrega UTC y la UI muestra America/Bogota (es-CO).

export const DISPLAY_TIME_ZONE = 'America/Bogota';
export const DISPLAY_LOCALE = 'es-CO';

const dateTimeFormatter = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
  timeZone: DISPLAY_TIME_ZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function toParts(date: Date): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of dateTimeFormatter.formatToParts(date)) {
    out[part.type] = part.value;
  }
  return out;
}

function shortMonth(raw: string | undefined): string {
  return (raw ?? '').replace('.', '').toLowerCase();
}

function toDate(value: Date | string): Date {
  return typeof value === 'string' ? new Date(value) : value;
}

/** Fecha y hora legibles: `30 oct 2026, 15:42` (doc 09 §8). */
export function formatDateTime(value: Date | string): string {
  const p = toParts(toDate(value));
  return `${p.day} ${shortMonth(p.month)} ${p.year}, ${p.hour}:${p.minute}`;
}

/** Reloj de la barra superior: `30 oct 2026 15:42` (doc 09 §2). */
export function formatClock(value: Date | string): string {
  const p = toParts(toDate(value));
  return `${p.day} ${shortMonth(p.month)} ${p.year} ${p.hour}:${p.minute}`;
}

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** Hora relativa corta (doc 09 §8): "hace 3 min", "hace 2 h", "hace 1 d". */
export function formatRelative(value: Date | string, now: Date | number = Date.now()): string {
  const nowMs = typeof now === 'number' ? now : now.getTime();
  const diff = nowMs - toDate(value).getTime();
  if (diff < MINUTE_MS) return 'hace un momento';
  if (diff < HOUR_MS) return `hace ${Math.floor(diff / MINUTE_MS)} min`;
  if (diff < DAY_MS) return `hace ${Math.floor(diff / HOUR_MS)} h`;
  return `hace ${Math.floor(diff / DAY_MS)} d`;
}

/** Porcentaje entero a partir de un valor 0..1: `94 %`. */
export function formatPercent(value: number): string {
  return `${Math.round(value * 100)} %`;
}

/** Factor con dos decimales y coma decimal: `0,94`. */
export function formatFactor(value: number): string {
  return value.toLocaleString(DISPLAY_LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
