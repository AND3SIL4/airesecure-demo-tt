import { CircleAlert, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
  /** Acciones adicionales junto a "Reintentar". */
  extraActions?: ReactNode;
  className?: string;
}

export function ErrorState({
  title = 'No se pudo cargar la información',
  message,
  onRetry,
  retrying = false,
  extraActions,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center gap-3 rounded-lg border border-slate-200 bg-surface px-6 py-10 text-center ${className}`}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-sev-alta/10 text-sev-alta-text">
        <CircleAlert aria-hidden="true" className="size-6" />
      </span>
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <p className="max-w-md text-sm text-slate-600">{message}</p>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
        {onRetry && (
          <Button variant="primary" icon={RefreshCw} loading={retrying} onClick={onRetry}>
            Reintentar
          </Button>
        )}
        {extraActions}
      </div>
    </div>
  );
}
