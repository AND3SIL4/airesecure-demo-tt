import { FlaskConical, ShieldCheck, TrendingUp } from 'lucide-react';
import { anomalyDetail, RULE_BASED_LABEL } from '../../../domain/dashboard';
import type { Anomaly } from '../../../domain/types';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';

export interface AnomaliesListProps {
  anomalies: readonly Anomaly[];
  className?: string;
}

const SCOPE_LABEL: Record<Anomaly['scope'], string> = {
  zone: 'Por zona',
  type: 'Por tipo',
};

/** Anomalías detectadas por reglas (doc 05 §7), siempre etiquetadas como demostrativas (HU-24, RF-B5). */
export function AnomaliesList({ anomalies, className = '' }: AnomaliesListProps) {
  return (
    <Card title="Anomalías" className={className}>
      <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-demo-fg/30 bg-demo-bg px-2.5 py-0.5 text-xs font-medium text-demo-fg">
        <FlaskConical aria-hidden="true" className="size-3.5" />
        {RULE_BASED_LABEL}
      </p>
      {anomalies.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Sin anomalías detectadas"
          message="No se detectaron aumentos inusuales en la última hora según las reglas configuradas."
          className="py-8"
        />
      ) : (
        <ul className="space-y-2" aria-label="Anomalías detectadas">
          {anomalies.map((anomaly) => (
            <li
              key={`${anomaly.scope}-${anomaly.key}`}
              className="flex items-start gap-3 rounded-md border border-slate-200 bg-surface-muted px-3 py-2.5"
            >
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-sev-alta/10 text-sev-alta-text">
                <TrendingUp aria-hidden="true" className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">{anomaly.label}</p>
                <p className="tabular text-xs text-slate-700">{anomalyDetail(anomaly)}</p>
                <p className="mt-0.5 text-xs text-slate-600">
                  {SCOPE_LABEL[anomaly.scope]} · {RULE_BASED_LABEL}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
