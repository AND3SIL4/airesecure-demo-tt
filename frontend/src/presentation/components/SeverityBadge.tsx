import { RISK_LEVEL_META } from '../../domain/severity';
import type { RiskLevel } from '../../domain/types';
import { SEVERITY_ICONS } from './icons';

export interface SeverityBadgeProps {
  severity: RiskLevel;
  size?: 'sm' | 'md';
  className?: string;
}

/** Severidad con icono, texto y color (nunca solo color). El rojo solo para `critica`. */
export function SeverityBadge({ severity, size = 'md', className = '' }: SeverityBadgeProps) {
  const meta = RISK_LEVEL_META[severity];
  const Icon = SEVERITY_ICONS[meta.icon];
  const sizeClass = size === 'sm' ? 'h-6 gap-1 px-2 text-xs' : 'h-7 gap-1.5 px-2.5 text-sm';
  const iconClass = size === 'sm' ? 'size-3.5' : 'size-4';
  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium whitespace-nowrap ${sizeClass} ${meta.colorClass} ${className}`}
    >
      <Icon aria-hidden="true" className={iconClass} />
      <span>
        <span className="sr-only">Severidad: </span>
        {meta.label}
      </span>
    </span>
  );
}
