import { Inbox, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  message?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ icon: Icon = Inbox, title, message, actionLabel, onAction, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 bg-surface px-6 py-12 text-center ${className}`}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-surface-muted text-slate-600">
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {message && <p className="max-w-md text-sm text-slate-600">{message}</p>}
      {actionLabel && onAction && (
        <Button variant="secondary" onClick={onAction} className="mt-1">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
