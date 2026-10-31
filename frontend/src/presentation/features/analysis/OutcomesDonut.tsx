import { Filter, PieChart as PieChartIcon } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { BELOW_THRESHOLD_NOTE, outcomesSummary, type AnalyticsDays } from '../../../domain/analytics';
import { formatNumber, formatPercent } from '../../../domain/format';
import type { AlertOutcomes } from '../../../domain/types';
import { EmptyState } from '../../components/EmptyState';
import { ChartTooltip } from '../summary/ChartTooltip';

export interface OutcomesDonutProps {
  outcomes: AlertOutcomes;
  days: AnalyticsDays;
}

const CONFIRMED_COLOR = 'var(--color-brand-600)';
const DISMISSED_COLOR = 'var(--color-chart-7)';

function BelowThresholdNote({ count }: { count: number }) {
  return (
    <p className="mt-3 flex items-start gap-2 rounded-md bg-surface-muted px-3 py-2 text-sm text-slate-700">
      <Filter aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-slate-600" />
      <span>
        <span className="tabular font-medium text-slate-900">Eventos bajo umbral acumulados: {formatNumber(count, 0)}</span>
        <span className="block text-xs text-slate-600">{BELOW_THRESHOLD_NOTE}</span>
      </span>
    </p>
  );
}

/** Alertas confirmadas frente a descartadas (falsos positivos) con la tasa de confirmación (RF-F3). */
export function OutcomesDonut({ outcomes, days }: OutcomesDonutProps) {
  const decided = outcomes.confirmed + outcomes.dismissed;
  const summary = outcomesSummary(outcomes, days);

  if (decided === 0) {
    return (
      <>
        <EmptyState
          icon={PieChartIcon}
          title="Sin alertas decididas en este rango"
          message="Cuando una persona confirme o descarte alertas, aquí verás la proporción."
          className="py-8"
        />
        <BelowThresholdNote count={outcomes.belowThreshold} />
      </>
    );
  }

  const data = [
    { key: 'confirmed', name: 'Confirmadas', count: outcomes.confirmed, color: CONFIRMED_COLOR },
    { key: 'dismissed', name: 'Descartadas (falsos positivos)', count: outcomes.dismissed, color: DISMISSED_COLOR },
  ];
  const rate = outcomes.confirmationRate ?? outcomes.confirmed / decided;

  return (
    <div className="flex flex-col gap-3">
      <p className="sr-only">{summary}</p>
      <div className="relative mx-auto h-44 w-full max-w-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart aria-label={summary}>
            <Pie
              data={data}
              dataKey="count"
              nameKey="name"
              innerRadius="62%"
              outerRadius="95%"
              paddingAngle={outcomes.confirmed > 0 && outcomes.dismissed > 0 ? 2 : 0}
              stroke="white"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.key} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip unit={{ one: 'alerta', many: 'alertas' }} />} />
          </PieChart>
        </ResponsiveContainer>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
        >
          <span className="tabular text-2xl font-semibold text-slate-900">{formatPercent(rate)}</span>
          <span className="text-xs text-slate-600">confirmadas</span>
        </div>
      </div>

      <ul aria-label="Resultado de las alertas" className="space-y-1 text-sm">
        {data.map((d) => (
          <li key={d.key} className="flex items-center gap-2 px-1.5">
            <span aria-hidden="true" className="size-3 shrink-0 rounded-sm" style={{ backgroundColor: d.color }} />
            <span className="min-w-0 flex-1 text-slate-800">{d.name}</span>
            <span className="tabular shrink-0 font-medium text-slate-900">{formatNumber(d.count, 0)}</span>
            <span className="tabular w-10 shrink-0 text-right text-xs text-slate-600">
              {Math.round((d.count / decided) * 100)} %
            </span>
          </li>
        ))}
      </ul>

      <BelowThresholdNote count={outcomes.belowThreshold} />
    </div>
  );
}
