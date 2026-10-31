import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from 'lucide-react';
import type { KpiVariation, VariationDirection, VariationTone } from '../../domain/kpis';

export interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  /** Variación ya interpretada (flecha, tono y textos); ver `describeVariation` en domain/kpis. */
  variation?: KpiVariation;
  className?: string;
}

const TONE_CLASSES: Record<VariationTone, string> = {
  better: 'text-ok-text',
  worse: 'text-sev-alta-text',
  neutral: 'text-slate-600',
};

const DIRECTION_ICONS: Record<VariationDirection, LucideIcon | null> = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: Minus,
  none: null,
};

/** Indicador con icono, valor grande y la variación con flecha, color semántico y texto. */
export function KpiCard({ icon: Icon, label, value, variation, className = '' }: KpiCardProps) {
  const DeltaIcon = variation ? DIRECTION_ICONS[variation.direction] : null;

  return (
    <div className={`rounded-lg border border-slate-200 bg-surface p-4 shadow-sm ${className}`}>
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-muted text-navy-900">
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <span>{label}</span>
      </div>
      <p className="tabular mt-3 text-3xl font-semibold text-slate-900">{value}</p>
      {variation && (
        <p className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${TONE_CLASSES[variation.tone]}`}>
          {DeltaIcon && <DeltaIcon aria-hidden="true" className="size-3.5" />}
          <span aria-hidden="true" className="tabular">
            {variation.text}
          </span>
          <span className="sr-only">Variación: {variation.srText}</span>
        </p>
      )}
    </div>
  );
}
