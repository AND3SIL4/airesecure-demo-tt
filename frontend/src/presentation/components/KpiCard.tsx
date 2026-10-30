import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from 'lucide-react';

export interface KpiDelta {
  /** Variación en porcentaje respecto al periodo anterior (positiva = aumento). */
  value: number;
  /** Texto del periodo de comparación, p. ej. "vs. ayer". */
  label?: string;
}

export interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  delta?: KpiDelta;
  /** Si es true, un aumento es negativo (p. ej., alertas críticas o tiempo de respuesta). */
  higherIsWorse?: boolean;
  className?: string;
}

function deltaTone(value: number, higherIsWorse: boolean): 'better' | 'worse' | 'neutral' {
  if (value === 0) return 'neutral';
  const increased = value > 0;
  return increased === higherIsWorse ? 'worse' : 'better';
}

const TONE_CLASSES = {
  better: 'text-ok-text',
  worse: 'text-sev-alta-text',
  neutral: 'text-slate-600',
} as const;

const TONE_TEXT = {
  better: 'mejora',
  worse: 'empeora',
  neutral: 'sin cambios',
} as const;

export function KpiCard({ icon: Icon, label, value, delta, higherIsWorse = false, className = '' }: KpiCardProps) {
  const tone = delta ? deltaTone(delta.value, higherIsWorse) : 'neutral';
  const DeltaIcon = !delta || delta.value === 0 ? Minus : delta.value > 0 ? ArrowUpRight : ArrowDownRight;
  const absDelta = delta ? Math.abs(delta.value).toLocaleString('es-CO', { maximumFractionDigits: 1 }) : '';
  const directionText = !delta ? '' : delta.value > 0 ? 'Aumentó' : delta.value < 0 ? 'Disminuyó' : 'Sin variación';

  return (
    <div className={`rounded-lg border border-slate-200 bg-surface p-4 shadow-sm ${className}`}>
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <span className="flex size-8 items-center justify-center rounded-md bg-surface-muted text-navy-900">
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <span>{label}</span>
      </div>
      <p className="tabular mt-3 text-3xl font-semibold text-slate-900">{value}</p>
      {delta && (
        <p className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${TONE_CLASSES[tone]}`}>
          <DeltaIcon aria-hidden="true" className="size-3.5" />
          <span aria-hidden="true" className="tabular">
            {delta.value !== 0 ? `${absDelta} %` : '0 %'}
            {delta.label ? ` ${delta.label}` : ''}
          </span>
          <span className="sr-only">
            {delta.value !== 0 ? `${directionText} ${absDelta} %` : directionText}
            {delta.label ? ` ${delta.label}` : ''} ({TONE_TEXT[tone]})
          </span>
        </p>
      )}
    </div>
  );
}
