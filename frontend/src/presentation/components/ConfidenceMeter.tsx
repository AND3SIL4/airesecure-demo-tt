import { formatPercent } from '../../domain/format';

export interface ConfidenceMeterProps {
  /** 0..1; null en los reportes manuales. */
  value: number | null;
  /** Versión de tabla: barra corta y solo el porcentaje. */
  compact?: boolean;
  className?: string;
}

const MANUAL_CONFIDENCE_LABEL = 'N/A: reporte humano';

/** Confianza del modelo demostrativo: barra + porcentaje en texto (nunca solo la barra). */
export function ConfidenceMeter({ value, compact = false, className = '' }: ConfidenceMeterProps) {
  if (value === null) {
    return (
      <span className={`text-sm whitespace-nowrap text-slate-600 ${className}`}>
        {compact ? 'N/A' : MANUAL_CONFIDENCE_LABEL}
        {compact && <span className="sr-only">: reporte humano</span>}
      </span>
    );
  }

  const clamped = Math.min(1, Math.max(0, value));
  const percent = formatPercent(clamped);
  return (
    <span className={`inline-flex items-center gap-2 ${compact ? '' : 'w-full'} ${className}`}>
      <span
        aria-hidden="true"
        className={`relative h-2 overflow-hidden rounded-full bg-slate-200 ${compact ? 'w-14' : 'flex-1'}`}
      >
        <span className="absolute inset-y-0 left-0 rounded-full bg-brand-600" style={{ width: `${clamped * 100}%` }} />
      </span>
      <span className="tabular text-sm font-medium whitespace-nowrap text-slate-800">
        <span className="sr-only">Confianza: </span>
        {percent}
      </span>
    </span>
  );
}
