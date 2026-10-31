import { BellOff } from 'lucide-react';
import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { markAllNotificationsRead, useNotifications } from '../../application/stores/notifications';
import { RelativeTime } from './RelativeTime';
import { SeverityBadge } from './SeverityBadge';

export interface NotificationsPopoverProps {
  id: string;
  /** Botón que abre el popover (para el clic fuera y la devolución del foco). */
  triggerRef: RefObject<HTMLButtonElement | null>;
  /** `returnFocus`: devolver el foco a la campana (Esc o al elegir un enlace). */
  onClose: (returnFocus: boolean) => void;
}

/** Últimas 10 notificaciones de la sesión. Esc cierra; el foco entra al primer elemento. */
export function NotificationsPopover({ id, triggerRef, onClose }: NotificationsPopoverProps) {
  const { items } = useNotifications();
  // Las no leídas al abrir se marcan visualmente aunque el store ya las dé por leídas.
  const [unreadAtOpen] = useState<ReadonlySet<string>>(
    () => new Set(items.filter((n) => !n.read).map((n) => n.id)),
  );
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    markAllNotificationsRead();
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>('a[href]');
    (first ?? panel)?.focus();
  }, []);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      onClose(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [onClose, triggerRef]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose(true);
    }
  };

  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null;
    if (!next) return;
    if (panelRef.current?.contains(next) || triggerRef.current?.contains(next)) return;
    onClose(false);
  };

  return (
    <div
      ref={panelRef}
      id={id}
      role="dialog"
      aria-label="Notificaciones"
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      className="absolute top-full right-0 z-40 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-lg border border-slate-200 bg-surface text-slate-900 shadow-xl focus:outline-none"
    >
      <div className="border-b border-slate-200 px-4 py-2.5">
        <p className="text-sm font-semibold">Notificaciones</p>
        <p className="text-xs text-slate-600">Últimas 10 de esta sesión</p>
      </div>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-slate-600">
          <BellOff aria-hidden="true" className="size-6 text-slate-400" />
          Sin notificaciones en esta sesión
        </div>
      ) : (
        <ul className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto">
          {items.map((n) => {
            const unread = unreadAtOpen.has(n.id);
            return (
              <li key={n.id}>
                <Link
                  to={`/alertas/${encodeURIComponent(n.id)}`}
                  onClick={() => onClose(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 focus-visible:bg-brand-600/5 focus-visible:outline-offset-[-2px]"
                >
                  <span
                    aria-hidden="true"
                    className={`mt-2 size-2 shrink-0 rounded-full ${unread ? 'bg-brand-600' : 'bg-transparent'}`}
                  />
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="flex items-center gap-2">
                      <SeverityBadge severity={n.severity} size="sm" />
                      <span className="tabular text-xs text-slate-600">{n.id}</span>
                      {unread && <span className="sr-only">(no leída)</span>}
                    </span>
                    <span className="block truncate text-sm font-medium text-slate-900">{n.typeName}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-600">
                      <span className="truncate">{n.zoneName}</span>
                      <span aria-hidden="true">·</span>
                      <RelativeTime value={n.detectedAt} tooltipSide="bottom-end" />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
