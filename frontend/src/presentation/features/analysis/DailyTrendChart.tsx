import { ChartLine } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatDayLabel, trendSummary, trendTotal, type AnalyticsDays } from '../../../domain/analytics';
import { SEVERITY_META } from '../../../domain/severity';
import type { DailySeverityCount, Severity } from '../../../domain/types';
import { EmptyState } from '../../components/EmptyState';
import { SeverityBadge } from '../../components/SeverityBadge';
import { CHART_AXIS_COLOR, CHART_GRID_COLOR } from '../summary/chartColors';
import { SeriesTooltip } from './SeriesTooltip';

export interface DailyTrendChartProps {
  points: readonly DailySeverityCount[];
  days: AnalyticsDays;
}

const AXIS_TICK = { fill: CHART_AXIS_COLOR, fontSize: 12 };

/** Orden de la pila: de la base (baja) a la cima (crítica). */
const STACK_ORDER: readonly Severity[] = ['baja', 'media', 'alta', 'critica'];

const SEVERITY_COLORS: Record<Severity, string> = {
  critica: 'var(--color-sev-critica)',
  alta: 'var(--color-sev-alta)',
  media: 'var(--color-sev-media)',
  baja: 'var(--color-sev-baja)',
};

/** Incidentes abiertos por día, apilados por severidad, con leyenda de icono + texto + color (RF-F2). */
export function DailyTrendChart({ points, days }: DailyTrendChartProps) {
  const summary = trendSummary(points, days);

  if (trendTotal(points) === 0) {
    return (
      <EmptyState
        icon={ChartLine}
        title="Sin incidentes en este rango"
        message="La evolución diaria aparecerá cuando haya incidentes registrados."
        className="py-8"
      />
    );
  }

  const totals = Object.fromEntries(
    STACK_ORDER.map((s) => [s, points.reduce((sum, p) => sum + p[s], 0)]),
  ) as Record<Severity, number>;

  return (
    <div className="flex flex-col gap-3">
      <p className="sr-only">{summary}</p>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={[...points]} margin={{ top: 8, right: 12, bottom: 0, left: -16 }} aria-label={summary}>
            <CartesianGrid stroke={CHART_GRID_COLOR} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(value: string) => formatDayLabel(value)}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: CHART_GRID_COLOR }}
              minTickGap={16}
            />
            <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} width={40} />
            <Tooltip
              content={
                <SeriesTooltip
                  labelFormatter={(label) => formatDayLabel(String(label))}
                  totalLabel="Total"
                  reverse
                />
              }
              cursor={{ stroke: CHART_GRID_COLOR }}
            />
            {STACK_ORDER.map((severity) => (
              <Area
                key={severity}
                type="monotone"
                dataKey={severity}
                name={SEVERITY_META[severity].label}
                stackId="severity"
                stroke={SEVERITY_COLORS[severity]}
                fill={SEVERITY_COLORS[severity]}
                fillOpacity={0.35}
                strokeWidth={1.5}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <ul aria-label="Totales por severidad" className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {[...STACK_ORDER].reverse().map((severity) => (
          <li key={severity} className="inline-flex items-center gap-1.5">
            <SeverityBadge severity={severity} size="sm" />
            <span className="tabular font-medium text-slate-900">{totals[severity]}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-600">Fecha de apertura en hora de Bogotá (UTC−5).</p>
    </div>
  );
}
