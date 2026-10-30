// Estado global del modal "Reportar evento" (research R11): se monta una vez en el Shell.
import { useSyncExternalStore } from 'react';

let open = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): boolean {
  return open;
}

export function openReportEvent(): void {
  if (open) return;
  open = true;
  emit();
}

export function closeReportEvent(): void {
  if (!open) return;
  open = false;
  emit();
}

export function useReportEventOpen(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
