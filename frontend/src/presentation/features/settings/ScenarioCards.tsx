import { Play } from 'lucide-react';
import { formatPercent } from '../../../domain/format';
import type { Scenario } from '../../../domain/types';
import { Button } from '../../components/Button';
import { SeverityBadge } from '../../components/SeverityBadge';

export interface ScenarioCardsProps {
  scenarios: Scenario[];
  /** Nombre legible por código de tipo (si el catálogo no cargó, se muestra el código). */
  typeNames: Record<string, string>;
  /** Nombre legible por id de zona. */
  zoneNames: Record<string, string>;
  /** Escenario que se está disparando (null si ninguno). */
  pendingId: string | null;
  onTrigger: (scenarioId: string) => void;
}

/** Escenarios E-1 a E-4 (doc 09 §3.10): tipo, severidad con icono y texto, zona, confianza y "Disparar". */
export function ScenarioCards({ scenarios, typeNames, zoneNames, pendingId, onTrigger }: ScenarioCardsProps) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {scenarios.map((scenario) => {
        const titleId = `scenario-${scenario.id}-title`;
        return (
          <li key={scenario.id}>
            <article
              aria-labelledby={titleId}
              className="flex h-full flex-col gap-3 rounded-lg border border-slate-200 bg-surface-muted p-4"
            >
              <header className="flex items-start justify-between gap-3">
                <h3 id={titleId} className="text-sm font-semibold text-slate-900">
                  <span className="tabular mr-1.5 rounded bg-navy-900 px-1.5 py-0.5 text-xs font-semibold text-white">
                    {scenario.id}
                  </span>
                  {scenario.name}
                </h3>
                <SeverityBadge severity={scenario.severity} size="sm" />
              </header>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <dt className="text-slate-600">Tipo</dt>
                <dd className="text-slate-900">{typeNames[scenario.typeCode] ?? scenario.typeCode}</dd>
                <dt className="text-slate-600">Zona</dt>
                <dd className="text-slate-900">{zoneNames[scenario.zoneId] ?? scenario.zoneId}</dd>
                <dt className="text-slate-600">Fuente</dt>
                <dd className="tabular text-slate-900">{scenario.sourceId}</dd>
                <dt className="text-slate-600">Confianza</dt>
                <dd className="tabular text-slate-900">{formatPercent(scenario.confidence)}</dd>
              </dl>
              <div className="mt-auto flex justify-end">
                <Button
                  size="sm"
                  icon={Play}
                  loading={pendingId === scenario.id}
                  disabled={pendingId !== null}
                  aria-label={`Disparar escenario ${scenario.id}: ${scenario.name}`}
                  onClick={() => onTrigger(scenario.id)}
                >
                  Disparar
                </Button>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
