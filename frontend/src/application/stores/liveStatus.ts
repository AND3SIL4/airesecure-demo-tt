// Estado de la conexión en vivo (research R8). `reconnecting` solo se publica tras 3 s seguidos sin conexión.
import { useSyncExternalStore } from 'react';
import type { LiveStatus } from '../../domain/liveEvents';

const RECONNECTING_DELAY_MS = 3000;

let status: LiveStatus = 'connecting';
/** Hubo una conexión abierta que se perdió: al reabrir hay que refrescar los datos (eventos perdidos). */
let wasDisconnected = false;
let hasBeenOpen = false;
let delayTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): LiveStatus {
  return status;
}

function clearDelay(): void {
  if (delayTimer !== null) {
    clearTimeout(delayTimer);
    delayTimer = null;
  }
}

function publish(next: LiveStatus): void {
  if (status === next) return;
  status = next;
  emit();
}

/**
 * Registra el estado crudo que informa `sse.ts`.
 * Devuelve `true` si es una reconexión tras haber perdido la conexión (hay que refrescar todo).
 */
export function reportLiveStatus(raw: LiveStatus): boolean {
  if (raw === 'open') {
    clearDelay();
    const reconnected = wasDisconnected;
    wasDisconnected = false;
    hasBeenOpen = true;
    publish('open');
    return reconnected;
  }
  // Se pierden eventos desde el corte, aunque dure menos de 3 s.
  if (hasBeenOpen) wasDisconnected = true;
  if (delayTimer === null && status !== 'reconnecting') {
    delayTimer = setTimeout(() => {
      delayTimer = null;
      wasDisconnected = true;
      publish('reconnecting');
    }, RECONNECTING_DELAY_MS);
  }
  return false;
}

/** Vuelve al estado inicial (al desmontar la suscripción). */
export function resetLiveStatus(): void {
  clearDelay();
  wasDisconnected = false;
  hasBeenOpen = false;
  publish('connecting');
}

export function useLiveStatus(): LiveStatus {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
