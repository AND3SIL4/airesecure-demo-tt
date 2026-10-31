import { CircleCheck, Timer, TimerOff } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  formatAvgSeconds,
  formatDayLabel,
  hasTimesData,
  minuteTicks,
  secondsToMinutes,
  timesSummary,
  type AnalyticsDays,
} from '../../../domain/analytics';
import { formatNumber } from '../../../domain/format';
import type { AnalyticsTimes } from '../../../domain/types';
import { EmptyState } from '../../components/EmptyState';
import { KpiCard } from '../../components/KpiCard';
import { CHART_AXIS_COLOR, CHART_GRID_COLOR } from '../summary/chartColors';
import { SeriesTooltip } from './SeriesTooltip';

export interface TimesPanelProps {
  times: AnalyticsTimes;
  days: AnalyticsDays;
}

const AXIS_TICK = { fill: CHART_AXIS_COLOR, fontSize: 12 };
const RESPONSE_COLOR = 'var(--color-brand-600)';
const RESOLUTION_COLOR = 'var(--color-chart-3)';

const formatMinutes = (value: number) => `${formatNumber(value)} min`;
const formatTick = (value: number) => `${formatNumber(value, 0)} min`;

function maxOf(values: readonly (number | null)[]): number {
  return values.reduce<number>((max, v) => (v !== null && v > max ? v : max), 0);
}

/** Tiempos medios de respuesta y resolución del rango (2 KPIs) y su evolución diaria en minutos (RF-F2). */
export function TimesPanel({ times, days }: TimesPanelProps) {
  if (!hasTimesData(times)) {
    return (
      <EmptyState
        icon={TimerOff}
        title="Sin tiempos registrados en este rango"
        message="Los tiempos aparecen cuando los incidentes se atienden y se resuelven."
        className="py-8"
      />
    );
  }

  const summary = timesSummary(times, days);
  const data = times.byDay.map((d) => ({
    date: d.date,
    response: secondsToMinutes(d.avgResponseSeconds),
    resolution: secondsToMinutes(d.avgResolutionSeconds),
  }));
  // Escalas independientes: la respuesta (minutos) y la resolución (horas) difieren en un orden de magnitud.
  const responseTicks = minuteTicks(maxOf(data.map((d) => d.response)));
  const resolutionTicks = minuteTicks(maxOf(data.map((d) => d.resolution)));

  return (
    <div className="flex flex-col gap-3">
      <p className="sr-only">{summary}</p>
      <div className="grid grid-cols-2 gap-3">
        <KpiCard icon={Timer} label="Respuesta media" value={formatAvgSeconds(times.avgResponseSeconds)} className="p-3 shadow-none" />
        <KpiCard
          icon={CircleCheck}
          label="Resolución media"
          value={formatAvgSeconds(times.avgResolutionSeconds)}
          className="p-3 shadow-none"
        />
      </div>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }} aria-label={summary}>
            <CartesianGrid stroke={CHART_GRID_COLOR} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(value: string) => formatDayLabel(value)}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: CHART_GRID_COLOR }}
              minTickGap={16}
            />
            <YAxis
              yAxisId="response"
              orientation="left"
              ticks={responseTicks}
              domain={[0, responseTicks[responseTicks.length - 1] ?? 1]}
              tickFormatter={formatTick}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <YAxis
              yAxisId="resolution"
              orientation="right"
              ticks={resolutionTicks}
              domain={[0, resolutionTicks[resolutionTicks.length - 1] ?? 1]}
              tickFormatter={formatTick}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip
              content={
                <SeriesTooltip labelFormatter={(label) => formatDayLabel(String(label))} formatValue={formatMinutes} />
              }
              cursor={{ stroke: CHART_GRID_COLOR }}
            />
            <Line
              yAxisId="response"
              type="monotone"
              dataKey="response"
              name="Respuesta"
              stroke={RESPONSE_COLOR}
              strokeWidth={2}
              dot={{ r: 2, fill: RESPONSE_COLOR }}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
            <Line
              yAxisId="resolution"
              type="monotone"
              dataKey="resolution"
              name="Resolución"
              stroke={RESOLUTION_COLOR}
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={{ r: 2, fill: RESOLUTION_COLOR }}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ul aria-hidden="true" className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-700">
        <li className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded" style={{ backgroundColor: RESPONSE_COLOR }} />
          Respuesta (línea continua, eje izquierdo)
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded border-t-2 border-dashed" style={{ borderColor: RESOLUTION_COLOR }} />
          Resolución (línea discontinua, eje derecho)
        </li>
      </ul>
      <p className="text-xs text-slate-600">Media diaria en minutos, cada serie con su propia escala; los días sin datos quedan en blanco.</p>
    </div>
  );
}
