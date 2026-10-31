// Suscripción a `GET /api/stream` con EventSource. Único punto de la app que usa EventSource.
// El navegador reintenta solo (el servidor envía `retry: 3000`); si la conexión queda cerrada
// (p. ej., el proxy de Vite responde 500 con la API caída), se reabre manualmente.
import { LIVE_EVENT_NAMES, type LiveEvent, type LiveStatus } from '../domain/liveEvents';

const STREAM_URL = '/api/stream';
const MANUAL_RETRY_MS = 3000;

export interface LiveEventHandlers {
  onEvent: (event: LiveEvent) => void;
  onStatus: (status: LiveStatus) => void;
}

/** Abre el stream y devuelve la función que lo cierra. */
export function connectLiveEvents({ onEvent, onStatus }: LiveEventHandlers): () => void {
  if (typeof EventSource === 'undefined') {
    onStatus('reconnecting');
    return () => {};
  }

  let source: EventSource | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  const handleMessage = (name: LiveEvent['name'], message: MessageEvent<string>) => {
    let data: unknown;
    try {
      data = JSON.parse(message.data);
    } catch {
      return; // Mensaje mal formado: se ignora sin romper la suscripción.
    }
    if (typeof data !== 'object' || data === null) return;
    onEvent({ name, data } as LiveEvent);
  };

  const open = () => {
    if (closed) return;
    const es = new EventSource(STREAM_URL);
    source = es;
    for (const name of LIVE_EVENT_NAMES) {
      es.addEventListener(name, (message) => handleMessage(name, message as MessageEvent<string>));
    }
    es.onopen = () => onStatus('open');
    es.onerror = () => {
      onStatus('reconnecting');
      if (es.readyState === EventSource.CLOSED && !closed && retryTimer === null) {
        retryTimer = setTimeout(() => {
          retryTimer = null;
          open();
        }, MANUAL_RETRY_MS);
      }
    };
  };

  onStatus('connecting');
  open();

  return () => {
    closed = true;
    if (retryTimer !== null) clearTimeout(retryTimer);
    if (source) {
      source.onopen = null;
      source.onerror = null;
      source.close();
    }
  };
}
