import { Calculator } from 'lucide-react';
import { formatFactor } from '../../domain/format';
import { SEVERITY_META } from '../../domain/severity';
import type { ScoreBreakdown as ScoreBreakdownData, Severity } from '../../domain/types';

export interface ScoreBreakdownProps {
  breakdown: ScoreBreakdownData;
  severity: Severity;
  className?: string;
}

interface Factor {
  label: string;
  detail: string;
  value: string;
}

/** "Por qué se priorizó": score 0-100 y sus tres factores (doc 05 §5), basado en reglas. */
export function ScoreBreakdown({ breakdown, severity, className = '' }: ScoreBreakdownProps) {
  const score = Math.min(100, Math.max(0, Math.round(breakdown.score)));
  const factors: Factor[] = [
    {
      label: 'Severidad',
      detail: SEVERITY_META[severity].label,
      value: `×${formatFactor(breakdown.severityWeight)}`,
    },
    breakdown.manual
      ? { label: 'Confianza', detail: 'N/A (reporte humano ×1,00)', value: `×${formatFactor(1)}` }
      : { label: 'Confianza', detail: 'Modelo demostrativo', value: `×${formatFactor(breakdown.confidence)}` },
    {
      label: 'Criticidad de zona',
      detail: `Nivel ${breakdown.zoneCriticality} de 3`,
      value: `×${formatFactor(breakdown.zoneFactor)}`,
    },
  ];
  const confidence = breakdown.manual ? 1 : breakdown.confidence;

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium text-slate-700">Score de prioridad</span>
          <span className="tabular text-2xl font-semibold text-slate-900">
            {score}
            <span className="text-sm font-normal text-slate-500"> / 100</span>
          </span>
        </div>
        <div
          role="img"
          aria-label={`Score ${score} de 100`}
          className="relative h-2.5 overflow-hidden rounded-full bg-slate-200"
        >
          <span className="absolute inset-y-0 left-0 rounded-full bg-navy-900" style={{ width: `${score}%` }} />
        </div>
      </div>

      <dl className="divide-y divide-slate-100 rounded-md border border-slate-200">
        {factors.map((f) => (
          <div key={f.label} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
            <dt className="text-slate-700">
              <span className="font-medium text-slate-900">{f.label}</span>
              <span className="text-slate-600"> · {f.detail}</span>
            </dt>
            <dd className="tabular font-semibold text-slate-900">{f.value}</dd>
          </div>
        ))}
      </dl>

      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
        <Calculator aria-hidden="true" className="size-3.5" />
        <span>Severidad × confianza × criticidad de zona</span>
        <span className="tabular">
          = 100 × {formatFactor(breakdown.severityWeight)} × {formatFactor(confidence)} ×{' '}
          {formatFactor(breakdown.zoneFactor)} ≈ {score}
        </span>
        <span className="rounded border border-slate-300 px-1.5 py-0.5 font-medium text-slate-700">
          Basado en reglas
        </span>
      </p>
    </div>
  );
}
