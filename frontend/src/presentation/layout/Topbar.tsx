import { Bell, OctagonAlert, Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCallback, useId, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLiveStatus } from '../../application/stores/liveStatus';
import { useNotifications } from '../../application/stores/notifications';
import { openReportEvent } from '../../application/stores/reportEvent';
import { AIRPORT_LABEL, UPCOMING_FEATURE_MESSAGE, viewTitleForPath } from '../../domain/navigation';
import { NotificationsPopover } from '../components/NotificationsPopover';
import { Tooltip } from '../components/Tooltip';
import { Clock } from './Clock';

interface PendingButtonProps {
  icon: LucideIcon;
  label: string;
  /** Muestra el texto solo desde 1280 px; por debajo queda el icono con el nombre accesible. */
  compactBelowXl?: boolean;
  iconOnly?: boolean;
  tooltipSide?: 'bottom' | 'bottom-end';
}

/** Botón de una función futura: enfocable, deshabilitado con aria-disabled y con tooltip. */
function PendingButton({
  icon: Icon,
  label,
  compactBelowXl = false,
  iconOnly = false,
  tooltipSide = 'bottom',
}: PendingButtonProps) {
  return (
    <Tooltip content={UPCOMING_FEATURE_MESSAGE} side={tooltipSide}>
      <button
        type="button"
        aria-disabled="true"
        aria-label={iconOnly ? label : undefined}
        onClick={(event) => event.preventDefault()}
        className="inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-md border border-white/15 px-3 text-sm font-medium text-slate-300 opacity-80"
      >
        <Icon aria-hidden="true" className="size-4 shrink-0" />
        {!iconOnly && <span className={compactBelowXl ? 'sr-only xl:not-sr-only' : ''}>{label}</span>}
      </button>
    </Tooltip>
  );
}

/** Campana con el contador de no leídas y el popover de las últimas 10 notificaciones. */
function NotificationsBell() {
  const { unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverId = useId();

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }, []);

  const countLabel = unreadCount > 9 ? '9+' : String(unreadCount);
  const accessibleName =
    unreadCount === 0
      ? 'Notificaciones'
      : `Notificaciones, ${unreadCount} sin leer`;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={accessibleName}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex h-9 items-center rounded-md border border-white/25 bg-white/5 px-3 text-white transition-colors duration-200 hover:bg-white/15"
      >
        <Bell aria-hidden="true" className="size-4" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="tabular absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-semibold text-white ring-2 ring-navy-900"
          >
            {countLabel}
          </span>
        )}
      </button>
      {open && <NotificationsPopover id={popoverId} triggerRef={buttonRef} onClose={close} />}
    </div>
  );
}

/** Indicador de la conexión en vivo: verde "En vivo" o ámbar "Reconectando…". */
function LiveIndicator() {
  const status = useLiveStatus();
  const meta =
    status === 'open'
      ? { label: 'En vivo', dot: 'bg-ok', pulse: true }
      : status === 'reconnecting'
        ? { label: 'Reconectando…', dot: 'bg-sev-media', pulse: false }
        : { label: 'Conectando…', dot: 'bg-slate-400', pulse: false };

  return (
    <div className="inline-flex h-9 items-center gap-2 px-2 text-sm text-slate-200">
      <span className="relative flex size-2.5" aria-hidden="true">
        {meta.pulse && (
          <span className={`absolute inline-flex size-full rounded-full opacity-60 motion-safe:animate-ping ${meta.dot}`} />
        )}
        <span className={`relative inline-flex size-2.5 rounded-full ${meta.dot}`} />
      </span>
      <span className="sr-only">Conexión en vivo: </span>
      <span className="sr-only xl:not-sr-only">{meta.label}</span>
    </div>
  );
}

/** Barra superior (64 px): título de la vista, aeropuerto, reloj y accesos rápidos. */
export function Topbar() {
  const { pathname } = useLocation();
  const title = viewTitleForPath(pathname);

  return (
    <header className="sticky top-8 z-30 flex h-16 items-center gap-4 bg-navy-900 px-4 text-white lg:px-6">
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-semibold" title={title}>
          {title}
        </p>
        <p className="hidden truncate text-xs text-slate-300 md:block" title={AIRPORT_LABEL}>
          {AIRPORT_LABEL}
        </p>
      </div>

      <Clock className="hidden text-sm text-slate-200 md:block" />

      <div className="flex shrink-0 items-center gap-2">
        <PendingButton icon={OctagonAlert} label="Críticas" compactBelowXl />
        <button
          type="button"
          onClick={openReportEvent}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-white/25 bg-white/5 px-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-white/15"
        >
          <Plus aria-hidden="true" className="size-4 shrink-0" />
          <span className="sr-only xl:not-sr-only">Reportar evento</span>
        </button>
        <NotificationsBell />
        <LiveIndicator />
      </div>
    </header>
  );
}
