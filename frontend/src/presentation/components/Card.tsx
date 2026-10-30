import { useId, type ReactNode } from 'react';

export interface CardProps {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Card({ title, actions, children, className = '' }: CardProps) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={title ? titleId : undefined}
      className={`rounded-lg border border-slate-200 bg-surface p-4 shadow-sm ${className}`}
    >
      {(title || actions) && (
        <header className="mb-3 flex items-center justify-between gap-3">
          {title && (
            <h2 id={titleId} className="text-base font-semibold text-slate-900">
              {title}
            </h2>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
