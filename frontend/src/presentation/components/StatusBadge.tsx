import { STATUS_META, type Status } from '../../domain/status';
import { STATUS_ICONS } from './icons';

export interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'md';
  className?: string;
}

/** Estado de alerta o incidente con icono, etiqueta legible y color. */
export function StatusBadge({ status, size = 'md', className = '' }: StatusBadgeProps) {
  const meta = STATUS_META[status];
  const Icon = STATUS_ICONS[meta.icon];
  const sizeClass = size === 'sm' ? 'h-6 gap-1 px-2 text-xs' : 'h-7 gap-1.5 px-2.5 text-sm';
  const iconClass = size === 'sm' ? 'size-3.5' : 'size-4';
  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium whitespace-nowrap ${sizeClass} ${meta.colorClass} ${className}`}
    >
      <Icon aria-hidden="true" className={iconClass} />
      <span>
        <span className="sr-only">Estado: </span>
        {meta.label}
      </span>
    </span>
  );
}
