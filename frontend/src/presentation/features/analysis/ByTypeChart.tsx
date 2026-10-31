import { ChartColumn } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { byTypeSummary, sumCounts, type AnalyticsDays } from '../../../domain/analytics';
import { formatNumber } from '../../../domain/format';
import type { CategoryCount } from '../../../domain/types';
import { EmptyState } from '../../components/EmptyState';
import { ChartTooltip } from '../summary/ChartTooltip';
import { CHART_AXIS_COLOR, CHART_GRID_COLOR, chartColor } from '../summary/chartColors';

export interface ByTypeChartProps {
  items: readonly CategoryCount[];
  days: AnalyticsDays;
}

const AXIS_TICK = { fill: CHART_AXIS_COLOR, fontSize: 12 };
const ROW_HEIGHT = 30;
const Y_AXIS_WIDTH = 168;
/** Caracteres visibles de la etiqueta (12 px) dentro de Y_AXIS_WIDTH; el resto va con elipsis. */
const LABEL_MAX_CHARS = 24;

function truncateLabel(text: string): string {
  return text.length > LABEL_MAX_CHARS ? `${text.slice(0, LABEL_MAX_CHARS - 1).trimEnd()}…` : text;
}

interface CategoryTickProps {
  x?: number | string;
  y?: number | string;
  payload?: { value?: string | number };
}

/** Etiqueta de una sola línea (sin ajuste de Recharts, que solapa filas); nombre completo en <title>. */
function CategoryTick({ x = 0, y = 0, payload }: CategoryTickProps) {
  const full = String(payload?.value ?? '');
  return (
    <text x={Number(x) - 6} y={Number(y)} dy="0.355em" textAnchor="end" fill={CHART_AXIS_COLOR} fontSize={12}>
      <title>{full}</title>
      {truncateLabel(full)}
    </text>
  );
}

/** Incidentes por tipo de la alerta de origen: barras con leyenda de texto y porcentaje (RF-F1). */
export function ByTypeChart({ items, days }: ByTypeChartProps) {
  const data = [...items].filter((t) => t.count > 0).sort((a, b) => b.count - a.count);
  const total = sumCounts(data);
  const summary = byTypeSummary(data, days);

  if (total === 0) {
    return (
      <EmptyState
        icon={ChartColumn}
        title="Sin incidentes en este rango"
        message="Cuando se confirmen alertas, aquí verás qué tipos predominan."
        className="py-8"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="w-full" style={{ height: data.length * ROW_HEIGHT + 32 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 0 }} aria-label={summary}>
            <CartesianGrid stroke={CHART_GRID_COLOR} strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="typeName"
              tick={<CategoryTick />}
              tickLine={false}
              axisLine={{ stroke: CHART_GRID_COLOR }}
              width={Y_AXIS_WIDTH}
              interval={0}
            />
            <Tooltip
              content={<ChartTooltip unit={{ one: 'incidente', many: 'incidentes' }} />}
              cursor={{ fill: 'var(--color-surface-muted)' }}
            />
            <Bar dataKey="count" name="Incidentes" radius={[0, 4, 4, 0]} isAnimationActive={false}>
              {data.map((t, index) => (
                <Cell key={t.typeCode} fill={chartColor(index)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ul aria-label={summary} className="space-y-0.5 text-sm">
        {data.map((t, index) => {
          const pct = Math.round((t.count / total) * 100);
          return (
            <li key={t.typeCode} className="flex items-center gap-2 px-1.5">
              <span aria-hidden="true" className="size-3 shrink-0 rounded-sm" style={{ backgroundColor: chartColor(index) }} />
              <span className="min-w-0 flex-1 truncate text-slate-800" title={t.typeName}>
                {t.typeName}
              </span>
              <span className="tabular shrink-0 font-medium text-slate-900">{formatNumber(t.count, 0)}</span>
              <span className="tabular w-10 shrink-0 text-right text-xs text-slate-600">{pct} %</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
