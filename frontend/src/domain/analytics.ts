// Vista Análisis (doc 09 §3.8): rango en la URL, títulos-pregunta, ayudas y resúmenes accesibles.
import { formatDuration, formatNumber, formatPercent } from './format';
import { SEVERITIES, SEVERITY_META } from './severity';
import type { AlertOutcomes, AnalyticsTimes, CategoryCount, DailySeverityCount, ZoneCount } from './types';

export const ANALYTICS_DAYS = [7, 14, 30] as const;
export type AnalyticsDays = (typeof ANALYTICS_DAYS)[number];
export const DEFAULT_ANALYTICS_DAYS: AnalyticsDays = 30;

/** `?days=` admite 7, 14 o 30; cualquier otro valor equivale a 30. */
export function parseDays(raw: string | null): AnalyticsDays {
  const value = Number.parseInt(raw ?? '', 10);
  return (ANALYTICS_DAYS as readonly number[]).includes(value) ? (value as AnalyticsDays) : DEFAULT_ANALYTICS_DAYS;
}

/** Solo se serializa lo que difiere del valor por defecto. */
export function daysToSearchParams(days: AnalyticsDays): URLSearchParams {
  const params = new URLSearchParams();
  if (days !== DEFAULT_ANALYTICS_DAYS) params.set('days', String(days));
  return params;
}

export function daysLabel(days: AnalyticsDays): string {
  return `${days} días`;
}

export const ANALYTICS_TITLES = {
  byZone: '¿Dónde ocurren más incidentes?',
  byType: '¿Qué tipos predominan?',
  trend: '¿Cómo evolucionan por severidad?',
  outcomes: '¿Cuántas alertas se confirman?',
  times: '¿Cuánto tardamos en responder y resolver?',
  anomalies: '¿Hay comportamientos inusuales?',
} as const;

export type AnalyticsBlock = keyof typeof ANALYTICS_TITLES;

/** Texto de ayuda (tooltip del icono de información) de cada bloque. */
export const ANALYTICS_HINTS: Record<AnalyticsBlock, string> = {
  byZone: 'Incidentes abiertos en el rango, agrupados por la zona de la alerta de origen.',
  byType: 'Incidentes abiertos en el rango, agrupados por el tipo de la alerta de origen.',
  trend: 'Incidentes abiertos cada día (hora de Bogotá), apilados por severidad.',
  outcomes:
    'Alertas detectadas en el rango y decididas por una persona: confirmadas frente a descartadas (falsos positivos).',
  times:
    'Respuesta: de la detección de la alerta a la primera acción humana. Resolución: de la detección al cierre del incidente (solo resueltos).',
  anomalies:
    'Aumentos de la última hora frente a la media horaria de los últimos 7 días (referencia mínima 1/h), según reglas fijas.',
};

export const BELOW_THRESHOLD_NOTE = 'Acumulado desde la carga de datos de la demo; no depende del rango.';

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'] as const;

/** `2026-10-02` → `02 oct` (fecha de calendario de Bogotá, sin conversión de zona). */
export function formatDayLabel(dateKey: string): string {
  const [, month, day] = dateKey.split('-');
  const name = MONTHS[Number(month) - 1] ?? '';
  return `${day ?? ''} ${name}`.trim();
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? `1 ${one}` : `${formatNumber(n, 0)} ${many}`;
}

const incidents = (n: number) => plural(n, 'incidente', 'incidentes');

function rangeText(days: AnalyticsDays): string {
  return `en los últimos ${days} días`;
}

export function sumCounts(items: readonly { count: number }[]): number {
  return items.reduce((sum, item) => sum + item.count, 0);
}

export function byZoneSummary(items: readonly ZoneCount[], days: AnalyticsDays): string {
  const total = sumCounts(items);
  if (total === 0) return `Sin incidentes ${rangeText(days)}.`;
  const parts = items
    .filter((z) => z.count > 0)
    .map((z) => `${z.zoneName}: ${z.count}`)
    .join('; ');
  return `${incidents(total)} ${rangeText(days)} por zona. ${parts}.`;
}

export function byTypeSummary(items: readonly CategoryCount[], days: AnalyticsDays): string {
  const total = sumCounts(items);
  if (total === 0) return `Sin incidentes ${rangeText(days)}.`;
  const parts = items.map((t) => `${t.typeName}: ${t.count}`).join('; ');
  return `${incidents(total)} ${rangeText(days)} por tipo. ${parts}.`;
}

export function trendTotal(points: readonly DailySeverityCount[]): number {
  return points.reduce((sum, p) => sum + p.total, 0);
}

export function trendSummary(points: readonly DailySeverityCount[], days: AnalyticsDays): string {
  const total = trendTotal(points);
  const first = points[0];
  if (total === 0 || !first) return `Sin incidentes ${rangeText(days)}.`;
  const peak = points.reduce((max, p) => (p.total > max.total ? p : max), first);
  const bySeverity = SEVERITIES.map((s) => {
    const n = points.reduce((sum, p) => sum + p[s], 0);
    return `${SEVERITY_META[s].label.toLowerCase()}: ${n}`;
  }).join(', ');
  return `${incidents(total)} ${rangeText(days)} (${bySeverity}). Día con más incidentes: ${formatDayLabel(
    peak.date,
  )}, con ${peak.total}.`;
}

export function outcomesSummary(outcomes: AlertOutcomes, days: AnalyticsDays): string {
  const decided = outcomes.confirmed + outcomes.dismissed;
  const below = `Eventos bajo umbral acumulados: ${formatNumber(outcomes.belowThreshold, 0)}.`;
  if (decided === 0) return `Sin alertas decididas ${rangeText(days)}. ${below}`;
  const rate = outcomes.confirmationRate === null ? '' : ` Tasa de confirmación: ${formatPercent(outcomes.confirmationRate)}.`;
  return `${plural(outcomes.confirmed, 'alerta confirmada', 'alertas confirmadas')} y ${plural(
    outcomes.dismissed,
    'descartada',
    'descartadas',
  )} ${rangeText(days)}.${rate} ${below}`;
}

export function formatAvgSeconds(seconds: number | null): string {
  return seconds === null ? 'Sin datos' : formatDuration(seconds);
}

export function hasTimesData(times: AnalyticsTimes): boolean {
  return (
    times.avgResponseSeconds !== null ||
    times.avgResolutionSeconds !== null ||
    times.byDay.some((d) => d.avgResponseSeconds !== null || d.avgResolutionSeconds !== null)
  );
}

export function timesSummary(times: AnalyticsTimes, days: AnalyticsDays): string {
  if (!hasTimesData(times)) return `Sin tiempos registrados ${rangeText(days)}.`;
  return `${rangeText(days).replace(/^en/, 'En')}: tiempo medio de respuesta ${formatAvgSeconds(
    times.avgResponseSeconds,
  )}; tiempo medio de resolución ${formatAvgSeconds(times.avgResolutionSeconds)}.`;
}

/** Segundos a minutos con un decimal para el eje del gráfico (null se conserva como hueco). */
export function secondsToMinutes(seconds: number | null): number | null {
  return seconds === null ? null : Math.round((seconds / 60) * 10) / 10;
}

const MINUTE_STEPS = [1, 2, 5, 10, 15, 20, 30, 60, 120, 240] as const;

/** Marcas "redondas" del eje en minutos (0 … >= max) con unas 4 divisiones. */
export function minuteTicks(maxMinutes: number): number[] {
  const max = Math.max(1, maxMinutes);
  const step = MINUTE_STEPS.find((s) => max / s <= 4) ?? Math.ceil(max / 4 / 60) * 60;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let t = 0; t <= top; t += step) ticks.push(t);
  return ticks;
}
