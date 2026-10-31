import { PieChart as PieChartIcon } from 'lucide-react';
import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { categorySummary, CHART_TITLES, sortCategories } from '../../../domain/dashboard';
import { formatNumber } from '../../../domain/format';
import type { CategoryCount } from '../../../domain/types';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { chartColor } from './chartColors';
import { ChartTooltip } from './ChartTooltip';

export interface CategoryDonutProps {
  items: readonly CategoryCount[];
  className?: string;
}

/** Incidentes por tipo de los últimos 7 días: dona con el total al centro y leyenda con texto (RF-B3). */
export function CategoryDonut({ items, className = '' }: CategoryDonutProps) {
  const data = sortCategories(items);
  const total = data.reduce((sum, c) => sum + c.count, 0);
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const active = data.find((c) => c.typeCode === activeCode) ?? null;

  return (
    <Card title={CHART_TITLES.byCategory} className={className}>
      {total === 0 ? (
        <EmptyState
          icon={PieChartIcon}
          title="Sin incidentes en 7 días"
          message="Cuando se confirmen alertas, aquí verás su distribución por tipo."
          className="py-8"
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="relative mx-auto h-48 w-full max-w-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart aria-label={categorySummary(data)}>
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="typeName"
                  innerRadius="62%"
                  outerRadius="95%"
                  paddingAngle={data.length > 1 ? 2 : 0}
                  stroke="white"
                  strokeWidth={2}
                  isAnimationActive={false}
                  onMouseEnter={(_, index) => setActiveCode(data[index]?.typeCode ?? null)}
                  onMouseLeave={() => setActiveCode(null)}
                >
                  {data.map((c, index) => (
                    <Cell
                      key={c.typeCode}
                      fill={chartColor(index)}
                      fillOpacity={activeCode === null || activeCode === c.typeCode ? 1 : 0.35}
                    />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip unit={{ one: 'incidente', many: 'incidentes' }} />} />
              </PieChart>
            </ResponsiveContainer>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
            >
              <span className="tabular text-2xl font-semibold text-slate-900">{formatNumber(active?.count ?? total, 0)}</span>
              <span className="max-w-24 truncate text-xs text-slate-600">{active ? active.typeName : 'Total'}</span>
            </div>
          </div>

          <ul aria-label="Incidentes por tipo" className="space-y-1 text-sm">
            {data.map((c, index) => {
              const pct = Math.round((c.count / total) * 100);
              return (
                <li
                  key={c.typeCode}
                  tabIndex={0}
                  aria-label={`${c.typeName}: ${formatNumber(c.count, 0)} ${c.count === 1 ? 'incidente' : 'incidentes'}, ${pct} %`}
                  onMouseEnter={() => setActiveCode(c.typeCode)}
                  onMouseLeave={() => setActiveCode(null)}
                  onFocus={() => setActiveCode(c.typeCode)}
                  onBlur={() => setActiveCode(null)}
                  className={`flex items-center gap-2 rounded px-1.5 py-1 ${
                    activeCode === c.typeCode ? 'bg-surface-muted' : ''
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="size-3 shrink-0 rounded-sm"
                    style={{ backgroundColor: chartColor(index) }}
                  />
                  <span className="min-w-0 flex-1 truncate text-slate-800" title={c.typeName}>
                    {c.typeName}
                  </span>
                  <span className="tabular shrink-0 font-medium text-slate-900">{c.count}</span>
                  <span className="tabular w-10 shrink-0 text-right text-xs text-slate-600">{pct} %</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Card>
  );
}
