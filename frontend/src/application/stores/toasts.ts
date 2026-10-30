// Store de toasts con useSyncExternalStore (sin librerías de estado).
import { useSyncExternalStore } from 'react';

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
  action?: ToastAction;
}

export interface ToastOptions {
  persistent?: boolean;
  action?: ToastAction;
}

const AUTO_DISMISS_MS = 5000;
const MAX_TOASTS = 5;

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

export function dismissToast(id: number): void {
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

function push(kind: ToastKind, message: string, options: ToastOptions = {}): number {
  const id = nextId++;
  const toast: Toast = { id, kind, message, persistent: options.persistent ?? false, action: options.action };
  const next = [...toasts, toast];
  // Se descartan los más antiguos no persistentes si hay demasiados.
  while (next.length > MAX_TOASTS) {
    const index = next.findIndex((t) => !t.persistent);
    const removed = next.splice(index === -1 ? 0 : index, 1)[0];
    if (removed) {
      const timer = timers.get(removed.id);
      if (timer) clearTimeout(timer);
      timers.delete(removed.id);
    }
  }
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
