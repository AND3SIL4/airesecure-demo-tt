import { Bell, OctagonAlert, Plus, Radio } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { openReportEvent } from '../../application/stores/reportEvent';
import { AIRPORT_LABEL, UPCOMING_FEATURE_MESSAGE, viewTitleForPath } from '../../domain/navigation';
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
        <PendingButton icon={Bell} label="Notificaciones" iconOnly tooltipSide="bottom-end" />
        <Tooltip content={UPCOMING_FEATURE_MESSAGE} side="bottom-end">
          <button
            type="button"
            aria-disabled="true"
            onClick={(event) => event.preventDefault()}
            className="inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-md px-2 text-sm text-slate-300"
          >
            <Radio aria-hidden="true" className="size-4" />
            <span className="size-2 rounded-full bg-slate-400" aria-hidden="true" />
            <span className="sr-only xl:not-sr-only">En vivo</span>
          </button>
        </Tooltip>
      </div>
    </header>
  );
}
