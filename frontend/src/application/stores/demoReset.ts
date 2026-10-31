// Marca del reinicio lanzado desde esta pestaña: evita que el evento `demo.reset` propio
// borre el toast de éxito con los conteos (el orden entre la respuesta HTTP y el SSE no está garantizado).

const LOCAL_RESET_WINDOW_MS = 15_000;

let localResetUntil = 0;

export function markLocalReset(): void {
  localResetUntil = Date.now() + LOCAL_RESET_WINDOW_MS;
}

export function clearLocalReset(): void {
  localResetUntil = 0;
}

/** true si el reinicio lo lanzó esta pestaña hace poco; consume la marca. */
export function consumeLocalReset(): boolean {
  const own = Date.now() < localResetUntil;
  localResetUntil = 0;
  return own;
}
