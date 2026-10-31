import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AlertSummary } from '../../../domain/types';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { RelativeTime } from '../../components/RelativeTime';
import { SeverityBadge } from '../../components/SeverityBadge';

export interface PriorityAlertsProps {
  alerts: readonly AlertSummary[];
  className?: string;
}

const ALL_ACTIVE_LINK = '/alertas?status=activas';

/** Hasta 6 alertas activas ordenadas por score, cada una con enlace al detalle (HU-04). */
export function PriorityAlerts({ alerts, className = '' }: PriorityAlertsProps) {
  return (
    <Card
      title="Alertas prioritarias"
      className={className}
      actions={
        <Link
          to={ALL_ACTIVE_LINK}
          className="inline-flex items-center gap-1 rounded text-sm font-medium text-brand-700 hover:text-brand-600 hover:underline"
        >
          Ver todas
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      }
    >
      {alerts.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Sin alertas activas"
          message="No hay alertas pendientes de atención en este momento."
          className="py-8"
        />
      ) : (
        <ol className="divide-y divide-slate-100" aria-label="Alertas ordenadas por prioridad">
          {alerts.map((alert, index) => (
            <li key={alert.id}>
              <Link
                to={`/alertas/${encodeURIComponent(alert.id)}`}
                className="group flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors duration-200 hover:bg-surface-muted"
              >
                <span className="sr-only">Prioridad {index + 1}: </span>
                <SeverityBadge severity={alert.severity} size="sm" className="w-24 shrink-0 justify-center" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-900 group-hover:underline">
                    {alert.type.name}
                  </span>
                  <span className="block truncate text-xs text-slate-600">
                    <span className="tabular">{alert.id}</span> · {alert.zone.name}
                  </span>
                </span>
                <span className="tabular hidden shrink-0 text-xs text-slate-600 sm:block">
                  <span className="sr-only">Score </span>
                  {Math.round(alert.score)}
                  <span aria-hidden="true">/100</span>
                </span>
                <RelativeTime value={alert.detectedAt} className="shrink-0 text-xs text-slate-600" />
              </Link>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
