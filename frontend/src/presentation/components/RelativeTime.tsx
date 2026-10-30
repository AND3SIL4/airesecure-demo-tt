import { useSyncExternalStore } from 'react';
import { formatDateTime, formatRelative } from '../../domain/format';
import { Tooltip } from './Tooltip';

// Un único temporizador compartido por todas las horas relativas visibles.
const TICK_MS = 30_000;
let now = Date.now();
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (timer === null) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      for (const l of listeners) l();
    }, TICK_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function getNow(): number {
  return now;
}

export interface RelativeTimeProps {
  /** ISO 8601 en UTC. */
  value: string;
  className?: string;
  /** Hace el elemento enfocable para mostrar el tooltip con teclado (fuera de filas enfocables). */
  focusable?: boolean;
  tooltipSide?: 'top' | 'bottom' | 'bottom-end' | 'right';
}

/** "hace 3 min" con la hora absoluta (America/Bogota) en un tooltip y para lectores de pantalla. */
export function RelativeTime({ value, className = '', focusable = false, tooltipSide = 'top' }: RelativeTimeProps) {
  const current = useSyncExternalStore(subscribe, getNow, getNow);
  const absolute = formatDateTime(value);
  return (
    <Tooltip content={absolute} side={tooltipSide}>
      <time dateTime={value} tabIndex={focusable ? 0 : undefined} className={`tabular whitespace-nowrap ${className}`}>
        {formatRelative(value, current)}
        <span className="sr-only"> ({absolute})</span>
      </time>
    </Tooltip>
  );
}
