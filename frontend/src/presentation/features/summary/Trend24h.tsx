import { ChartLine } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_TITLES, trendSummary } from '../../../domain/dashboard';
import { formatHour } from '../../../domain/format';
import type { HourlyCount } from '../../../domain/types';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { CHART_AXIS_COLOR, CHART_GRID_COLOR, CHART_LINE_COLOR } from './chartColors';
import { ChartTooltip } from './ChartTooltip';

export interface Trend24hProps {
  points: readonly HourlyCount[];
  className?: string;
}

const AXIS_TICK = { fill: CHART_AXIS_COLOR, fontSize: 12 };

/** Alertas por hora de las últimas 24 h (hora de Bogotá), con tooltip y resumen accesible (RF-B4). */
export function Trend24h({ points, className = '' }: Trend24hProps) {
  const data = points.map((p) => ({ hour: formatHour(p.hour), count: p.count }));
  const total = points.reduce((sum, p) => sum + p.count, 0);

  return (
    <Card title={CHART_TITLES.trend24h} className={className}>
      {total === 0 ? (
        <EmptyState
          icon={ChartLine}
          title="Sin datos de las últimas 24 h"
          message="La tendencia aparecerá cuando haya alertas registradas."
          className="py-8"
        />
      ) : (
        <>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -16 }} aria-label={trendSummary(points)}>
                <CartesianGrid stroke={CHART_GRID_COLOR} strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={AXIS_TICK}
                  tickLine={false}
                  axisLine={{ stroke: CHART_GRID_COLOR }}
                  interval={5}
                  minTickGap={8}
                />
                <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} width={40} />
                <Tooltip
                  content={
                    <ChartTooltip unit={{ one: 'alerta', many: 'alertas' }} labelFormatter={(label) => `${label} h`} />
                  }
                  cursor={{ stroke: CHART_GRID_COLOR }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Alertas"
                  stroke={CHART_LINE_COLOR}
                  strokeWidth={2}
                  dot={{ r: 2, fill: CHART_LINE_COLOR }}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-slate-600">Hora de Bogotá (UTC−5). Usa las flechas sobre el gráfico para recorrer las horas.</p>
        </>
      )}
    </Card>
  );
}
