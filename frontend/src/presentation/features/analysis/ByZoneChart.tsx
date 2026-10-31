import { MapPinOff } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { byZoneSummary, sumCounts, type AnalyticsDays } from '../../../domain/analytics';
import type { ZoneCount } from '../../../domain/types';
import { EmptyState } from '../../components/EmptyState';
import { ChartTooltip } from '../summary/ChartTooltip';
import { CHART_AXIS_COLOR, CHART_GRID_COLOR, CHART_LINE_COLOR } from '../summary/chartColors';

export interface ByZoneChartProps {
  items: readonly ZoneCount[];
  days: AnalyticsDays;
}

const AXIS_TICK = { fill: CHART_AXIS_COLOR, fontSize: 12 };
const ROW_HEIGHT = 26;

/** Incidentes por zona en el rango: barras horizontales de mayor a menor (RF-F1). */
export function ByZoneChart({ items, days }: ByZoneChartProps) {
  const data = [...items].sort((a, b) => b.count - a.count);
  const summary = byZoneSummary(data, days);

  if (sumCounts(data) === 0) {
    return (
      <EmptyState
        icon={MapPinOff}
        title="Sin incidentes en este rango"
        message="Cuando se confirmen alertas, aquí verás en qué zonas ocurren."
        className="py-8"
      />
    );
  }

  return (
    <>
      <p className="sr-only">{summary}</p>
      <div className="w-full" style={{ height: data.length * ROW_HEIGHT + 32 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 0 }} aria-label={summary}>
            <CartesianGrid stroke={CHART_GRID_COLOR} strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="zoneName"
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: CHART_GRID_COLOR }}
              width={140}
              interval={0}
            />
            <Tooltip
              content={<ChartTooltip unit={{ one: 'incidente', many: 'incidentes' }} />}
              cursor={{ fill: 'var(--color-surface-muted)' }}
            />
            <Bar dataKey="count" name="Incidentes" fill={CHART_LINE_COLOR} radius={[0, 4, 4, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
