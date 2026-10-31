// Textos derivados del Resumen (resúmenes accesibles de los gráficos y detalle de las anomalías).
import { formatHour, formatNumber } from './format';
import type { Anomaly, CategoryCount, HourlyCount, Zone, ZoneStatus } from './types';

export const RULE_BASED_LABEL = 'Detección basada en reglas · demostrativa';

export const CHART_TITLES = {
  byCategory: '¿Qué tipos de incidente predominan? (7 días)',
  trend24h: '¿Cómo evolucionan las alertas? (24 h)',
} as const;

function plural(n: number, one: string, many: string): string {
  return n === 1 ? `1 ${one}` : `${formatNumber(n, 0)} ${many}`;
}

/** Total y categorías ordenadas de mayor a menor. */
export function sortCategories(items: readonly CategoryCount[]): CategoryCount[] {
  return [...items].filter((c) => c.count > 0).sort((a, b) => b.count - a.count);
}

export function categorySummary(items: readonly CategoryCount[]): string {
  const sorted = sortCategories(items);
  const total = sorted.reduce((sum, c) => sum + c.count, 0);
  if (total === 0) return 'Sin incidentes en los últimos 7 días.';
  const parts = sorted.map((c) => `${c.typeName}: ${c.count}`).join('; ');
  return `${plural(total, 'incidente', 'incidentes')} en los últimos 7 días. ${parts}.`;
}

export function trendSummary(points: readonly HourlyCount[]): string {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return 'Sin datos de las últimas 24 horas.';
  const total = points.reduce((sum, p) => sum + p.count, 0);
  const peak = points.reduce((max, p) => (p.count > max.count ? p : max), first);
  const base = `${plural(total, 'alerta', 'alertas')} en las últimas 24 horas.`;
  if (total === 0) return base;
  return `${base} Pico de ${plural(peak.count, 'alerta', 'alertas')} a las ${formatHour(peak.hour)}; en la hora de las ${formatHour(
    last.hour,
  )}, ${plural(last.count, 'alerta', 'alertas')}.`;
}

/** "5 en la última hora · referencia 1/h · +400 %" */
export function anomalyDetail(anomaly: Anomaly): string {
  const sign = anomaly.variationPct >= 0 ? '+' : '−';
  return `${formatNumber(anomaly.lastHour, 0)} en la última hora · referencia ${formatNumber(
    anomaly.hourlyMean,
  )}/h · ${sign}${formatNumber(Math.abs(anomaly.variationPct), 0)} %`;
}

/** Geometría del catálogo con el riesgo y las alertas activas del resumen (más recientes). */
export function mergeZoneStatus(zones: readonly Zone[], statuses: readonly ZoneStatus[]): Zone[] {
  const byId = new Map(statuses.map((s) => [s.id, s]));
  return zones.map((zone) => {
    const status = byId.get(zone.id);
    return status ? { ...zone, riskLevel: status.riskLevel, activeAlerts: status.activeAlerts } : zone;
  });
}
