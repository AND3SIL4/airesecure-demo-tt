"""Bus de eventos en memoria para SSE (research R2 de 003). Implementa `services.ports.EventPublisher`.

`publish()` es seguro entre hilos: los endpoints síncronos corren en el threadpool y el simulador ejecuta sus
ticks con `asyncio.to_thread`, así que el reparto a las colas se agenda en el event loop principal con
`loop.call_soon_threadsafe`. Requiere un solo proceso uvicorn (sin `--workers`).
"""

import asyncio
import logging
import signal
import threading
from collections.abc import Callable
from types import FrameType
from typing import Any

logger = logging.getLogger(__name__)

QUEUE_MAXSIZE = 100

# Mensaje en cola: (evento, datos); `None` indica que el bus se cerró y el stream debe terminar.
LiveMessage = tuple[str, dict[str, Any]]
SubscriberQueue = asyncio.Queue[LiveMessage | None]


class EventBus:
    def __init__(self) -> None:
        self._loop: asyncio.AbstractEventLoop | None = None
        self._subscribers: set[SubscriberQueue] = set()
        self._closed = False

    def bind_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        """Enlaza el event loop principal (en el lifespan). Sin loop enlazado, `publish` no hace nada."""
        self._loop = loop
        self._closed = False

    @property
    def subscriber_count(self) -> int:
        return len(self._subscribers)

    @property
    def closed(self) -> bool:
        return self._closed

    def subscribe(self) -> SubscriberQueue:
        """Debe llamarse desde el event loop. Si el bus ya se cerró, la cola recibe el fin de inmediato."""
        queue: SubscriberQueue = asyncio.Queue(maxsize=QUEUE_MAXSIZE)
        if self._closed:
            queue.put_nowait(None)
        self._subscribers.add(queue)
        return queue

    def unsubscribe(self, queue: SubscriberQueue) -> None:
        self._subscribers.discard(queue)

    def publish(self, event: str, data: dict[str, Any]) -> None:
        """Seguro entre hilos; nunca lanza (un fallo en vivo no debe romper una escritura ya hecha)."""
        loop = self._loop
        if loop is None or loop.is_closed():
            return
        try:
            loop.call_soon_threadsafe(self._fanout, (event, data))
        except RuntimeError:  # el loop se cerró entre la comprobación y la llamada (apagado)
            logger.debug("Evento %s descartado: el event loop ya no está activo", event)

    def close(self) -> None:
        """Termina los streams abiertos (apagado del servidor). Seguro entre hilos y desde un manejador de
        señales."""
        loop = self._loop
        if loop is None or loop.is_closed():
            self._closed = True
            return
        try:
            loop.call_soon_threadsafe(self._close)
        except RuntimeError:
            self._closed = True

    def _close(self) -> None:
        self._closed = True
        for queue in list(self._subscribers):
            self._put(queue, None)

    def _fanout(self, message: LiveMessage) -> None:
        for queue in list(self._subscribers):
            self._put(queue, message)

    @staticmethod
    def _put(queue: SubscriberQueue, item: LiveMessage | None) -> None:
        """Encola sin bloquear; si la cola está llena (cliente lento), descarta su evento más antiguo."""
        if queue.full():
            try:
                queue.get_nowait()
            except asyncio.QueueEmpty:
                pass
        queue.put_nowait(item)


_EXIT_SIGNALS: tuple[signal.Signals, ...] = (signal.SIGINT, signal.SIGTERM) + (
    (signal.SIGBREAK,) if hasattr(signal, "SIGBREAK") else ()
)


def close_on_exit_signals(bus: EventBus) -> None:
    """Encadena `bus.close()` a los manejadores de señales de salida que haya instalado uvicorn.

    Uvicorn espera a que terminen las conexiones abiertas antes del cierre del lifespan, y un stream
    SSE no termina por sí solo: sin esto, Ctrl+C se quedaría esperando a los navegadores conectados. Debe
    llamarse en el lifespan (hilo principal); uvicorn restaura sus manejadores originales al salir.
    """
    if threading.current_thread() is not threading.main_thread():
        return
    for sig in _EXIT_SIGNALS:
        previous = signal.getsignal(sig)
        if not callable(previous):
            continue

        def _handler(
            signum: int,
            frame: FrameType | None,
            _previous: Callable[[int, FrameType | None], Any] = previous,
        ) -> None:
            bus.close()
            _previous(signum, frame)

        try:
            signal.signal(sig, _handler)
        except (ValueError, OSError):  # pragma: no cover - plataformas sin la señal
            logger.debug("No se pudo instalar el manejador de %s", sig)
