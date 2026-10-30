// Perfil simulado activo, persistido en localStorage['aerosecure.actor'] (research R9).
import { useSyncExternalStore } from 'react';
import { setActorProvider } from '../../infrastructure/http';

const STORAGE_KEY = 'aerosecure.actor';

const listeners = new Set<() => void>();

function readStorage(): string | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value && value.trim() ? value : null;
  } catch {
    return null;
  }
}

let actorId: string | null = readStorage();

function emit(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getActorId(): string | null {
  return actorId;
}

export function setActor(id: string): void {
  actorId = id;
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Sin almacenamiento disponible: el perfil vive solo en memoria.
  }
  emit();
}

export function clearActor(): void {
  if (actorId === null) return;
  actorId = null;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignorado: ver setActor.
  }
  emit();
}

export function useActorId(): string | null {
  return useSyncExternalStore(subscribe, getActorId, getActorId);
}

// Sincroniza el perfil entre pestañas.
window.addEventListener('storage', (event) => {
  if (event.key !== STORAGE_KEY) return;
  actorId = readStorage();
  emit();
});

setActorProvider(getActorId);
