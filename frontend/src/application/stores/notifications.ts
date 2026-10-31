// Notificaciones de la sesión (campana), llegadas de alertas (lista en vivo) y vistas de detalle activas.
import { useSyncExternalStore } from 'react';
import type { Severity } from '../../domain/types';

const MAX_NOTIFICATIONS = 10;
const MAX_ARRIVALS = 50;

export interface LiveNotification {
  /** Id de la alerta. */
  id: string;
  severity: Severity;
  typeName: string;
  zoneName: string;
  /** ISO 8601 en UTC. */
  detectedAt: string;
  read: boolean;
}

export interface AlertArrival {
  id: string;
  /** Secuencia creciente de llegada. */
  seq: number;
  /** `Date.now()` al recibir el evento. */
  at: number;
}

interface NotificationsState {
  items: readonly LiveNotification[];
  unreadCount: number;
}

let state: NotificationsState = { items: [], unreadCount: 0 };
let arrivals: readonly AlertArrival[] = [];
let arrivalSeq = 0;
const listeners = new Set<() => void>();
const arrivalListeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function emitArrivals(): void {
  for (const listener of arrivalListeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function subscribeArrivals(listener: () => void): () => void {
  arrivalListeners.add(listener);
  return () => arrivalListeners.delete(listener);
}

function getSnapshot(): NotificationsState {
  return state;
}

function getArrivals(): readonly AlertArrival[] {
  return arrivals;
}

function setItems(items: readonly LiveNotification[]): void {
  state = { items, unreadCount: items.filter((n) => !n.read).length };
  emit();
}

/** Añade una notificación (las últimas 10; la más reciente primero). */
export function pushNotification(notification: Omit<LiveNotification, 'read'>): void {
  const rest = state.items.filter((n) => n.id !== notification.id);
  setItems([{ ...notification, read: false }, ...rest].slice(0, MAX_NOTIFICATIONS));
}

export function markAllNotificationsRead(): void {
  if (state.unreadCount === 0) return;
  setItems(state.items.map((n) => (n.read ? n : { ...n, read: true })));
}

export function clearNotifications(): void {
  setItems([]);
  arrivals = [];
  emitArrivals();
}

export function useNotifications(): NotificationsState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Registra la llegada de una alerta nueva (de cualquier actor) para resaltarla en la lista. */
export function recordAlertArrival(id: string): void {
  arrivalSeq += 1;
  arrivals = [...arrivals, { id, seq: arrivalSeq, at: Date.now() }].slice(-MAX_ARRIVALS);
  emitArrivals();
}

/** Secuencia de la última llegada (0 si no hubo ninguna). */
export function getLastArrivalSeq(): number {
  return arrivalSeq;
}

/** Llegadas recientes de alertas (las últimas 50). */
export function useAlertArrivals(): readonly AlertArrival[] {
  return useSyncExternalStore(subscribeArrivals, getArrivals, getArrivals);
}

// ---------------------------------------------------------------------------
// Vistas de detalle activas (aviso "La alerta X fue … por otro usuario").
// ---------------------------------------------------------------------------

const activeViews = new Map<string, number>();

/** Registra que el detalle de la alerta está montado; devuelve la función que lo desregistra. */
export function registerActiveAlertView(id: string): () => void {
  activeViews.set(id, (activeViews.get(id) ?? 0) + 1);
  return () => {
    const count = (activeViews.get(id) ?? 1) - 1;
    if (count <= 0) activeViews.delete(id);
    else activeViews.set(id, count);
  };
}

export function isAlertViewActive(id: string): boolean {
  return activeViews.has(id);
}
