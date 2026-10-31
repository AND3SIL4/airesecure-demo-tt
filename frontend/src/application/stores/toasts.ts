// Store de toasts con useSyncExternalStore (sin librerías de estado).
import { useSyncExternalStore } from 'react';
import type { Severity } from '../../domain/types';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastAction {
  label: string;
  /** Ruta interna de la app (se navega con Link, sin recargar). */
  to: string;
}

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
  persistent: boolean;
  /** Se anuncia en la región `aria-live="assertive"` (errores y alertas críticas). */
  assertive: boolean;
  action?: ToastAction;
  /** Severidad a mostrar con SeverityBadge (avisos de alertas nuevas). */
  severity?: Severity;
}

export interface ToastOptions {
  persistent?: boolean;
  assertive?: boolean;
  action?: ToastAction;
  severity?: Severity;
}

const AUTO_DISMISS_MS = 5000;
/** Máximo de toasts no persistentes visibles (se descarta el más antiguo). */
const MAX_TRANSIENT = 3;
/** Tope de seguridad para los persistentes, para no tapar la pantalla. */
const MAX_PERSISTENT = 5;

let toasts: readonly Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();

function emit(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): readonly Toast[] {
  return toasts;
}

function clearTimer(id: number): void {
  const timer = timers.get(id);
  if (timer) clearTimeout(timer);
  timers.delete(id);
}

export function dismissToast(id: number): void {
  clearTimer(id);
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

/** Quita los más antiguos del grupo indicado hasta dejar `max`. */
function trim(list: Toast[], persistent: boolean, max: number): void {
  let count = list.filter((t) => t.persistent === persistent).length;
  while (count > max) {
    const index = list.findIndex((t) => t.persistent === persistent);
    const [removed] = list.splice(index, 1);
    if (removed) clearTimer(removed.id);
    count -= 1;
  }
}

function push(kind: ToastKind, message: string, options: ToastOptions = {}): number {
  const id = nextId++;
  const toast: Toast = {
    id,
    kind,
    message,
    persistent: options.persistent ?? false,
    assertive: options.assertive ?? kind === 'error',
    action: options.action,
    severity: options.severity,
  };
  const next = [...toasts, toast];
  trim(next, false, MAX_TRANSIENT);
  trim(next, true, MAX_PERSISTENT);
  toasts = next;
  if (!toast.persistent) {
    timers.set(
      id,
      setTimeout(() => dismissToast(id), AUTO_DISMISS_MS),
    );
  }
  emit();
  return id;
}

/** Cierra todos los toasts (p. ej., al reiniciar la demo). */
export function clearToasts(): void {
  for (const id of timers.keys()) clearTimer(id);
  toasts = [];
  emit();
}

export const toast = {
  success: (message: string, options?: ToastOptions) => push('success', message, options),
  error: (message: string, options?: ToastOptions) => push('error', message, options),
  info: (message: string, options?: ToastOptions) => push('info', message, options),
  dismiss: dismissToast,
};

export function useToastList(): readonly Toast[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useToasts() {
  return toast;
}
