import { ArrowRight, Lock, ShieldCheck, X } from 'lucide-react';
import { useId } from 'react';
import { Link } from 'react-router-dom';
import { formatHour } from '../../../domain/format';
import { alertCountLabel, alertsForZone, sortZonesByRisk } from '../../../domain/map3d';
import type { AlertSummary, Zone } from '../../../domain/types';
import { ErrorState } from '../../components/ErrorState';
import { SeverityBadge } from '../../components/SeverityBadge';
import { Skeleton } from '../../components/Skeleton';

export type ZonePanelAlertsState = 'pending' | 'error' | 'ready';

export interface ZonePanelProps {
  zones: readonly Zone[];
  /** Alertas activas (todas las zonas). */
  alerts: readonly AlertSummary[];
  alertsState: ZonePanelAlertsState;
  onRetryAlerts: () => void;
  retryingAlerts?: boolean;
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string) => void;
  onClearSelection: () => void;
  className?: string;
}

/**
 * Panel lateral del Mapa (plan R7): la lista accesible de las zonas (alternativa a la escena 3D)
 * y las alertas activas de la zona seleccionada.
 */
export function ZonePanel({
  zones,
  alerts,
  alertsState,
  onRetryAlerts,
  retryingAlerts = false,
  selectedZoneId,
  onSelectZone,
  onClearSelection,
  className = '',
}: ZonePanelProps) {
  const listTitleId = useId();
  const alertsTitleId = useId();
  const selected = zones.find((z) => z.id === selectedZoneId) ?? null;
  const zoneAlerts = selected ? alertsForZone(alerts, selected.id) : [];

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <section aria-labelledby={listTitleId}>
        <h2 id={listTitleId} className="mb-2 text-base font-semibold text-slate-900">
          Zonas de la terminal
        </h2>
        <ul className="space-y-1">
          {sortZonesByRisk(zones).map((zone) => {
            const isSelected = zone.id === selectedZoneId;
            return (
              <li key={zone.id}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onSelectZone(zone.id)}
                  className={`flex w-full flex-col gap-1 rounded-md border px-2 py-2 text-left transition-colors duration-200 ${
                    isSelected
                      ? 'border-brand-600 bg-brand-600/10'
                      : 'border-transparent hover:border-slate-200 hover:bg-surface-muted'
                  }`}
                >
                  {/* Nombre completo en la primera línea (con salto si hace falta); metadatos debajo. */}
                  <span className="block text-sm font-medium break-words text-slate-900">{zone.name}</span>
                  <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-600">
                    <SeverityBadge severity={zone.riskLevel} size="sm" />
                    <span className="tabular">{alertCountLabel(zone.activeAlerts)}</span>
                    {zone.restricted && (
                      <span className="inline-flex items-center gap-1">
                        <span aria-hidden="true">·</span>
                        <Lock aria-hidden="true" className="size-3" />
                        Restringida
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby={alertsTitleId} className="border-t border-slate-200 pt-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h2 id={alertsTitleId} className="text-base font-semibold text-slate-900">
            {selected ? `Alertas activas · ${selected.name}` : 'Alertas activas de la zona'}
          </h2>
          {selected && (
            <button
              type="button"
              onClick={onClearSelection}
              aria-label="Quitar la selección de zona"
              className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          )}
        </div>
        <p role="status" className="sr-only">
          {selected ? `Zona seleccionada: ${selected.name}, ${alertCountLabel(selected.activeAlerts).toLowerCase()}.` : ''}
        </p>

        {!selected ? (
          <p className="text-sm text-slate-600">
            Selecciona una zona en la lista o en el mapa para ver sus alertas activas.
          </p>
        ) : alertsState === 'pending' ? (
          <Skeleton rows={3} label="Cargando las alertas de la zona…" />
        ) : alertsState === 'error' ? (
          <ErrorState
            title="No se pudieron cargar las alertas"
            message="Inténtalo de nuevo en unos segundos."
            onRetry={onRetryAlerts}
            retrying={retryingAlerts}
            className="py-6"
          />
        ) : zoneAlerts.length === 0 ? (
          <p className="flex items-center gap-2 rounded-md bg-ok/10 px-3 py-2 text-sm text-ok-text">
            <ShieldCheck aria-hidden="true" className="size-4 shrink-0" />
            Sin alertas activas en esta zona
          </p>
        ) : (
          <>
            <ul className="divide-y divide-slate-100">
              {zoneAlerts.map((alert) => (
                <li key={alert.id}>
                  <Link
                    to={`/alertas/${encodeURIComponent(alert.id)}`}
                    className="group flex items-center gap-2 rounded-md px-1 py-2 transition-colors duration-200 hover:bg-surface-muted"
                  >
                    <SeverityBadge severity={alert.severity} size="sm" className="w-24 shrink-0 justify-center" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-900 group-hover:underline">
                        {alert.type.name}
                      </span>
                      <span className="block truncate text-xs text-slate-600">
                        <span className="tabular">{alert.id}</span> ·{' '}
                        <time dateTime={alert.detectedAt} className="tabular">
                          {formatHour(alert.detectedAt)}
                        </time>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              to={`/alertas?status=activas&zone=${encodeURIComponent(selected.id)}`}
              className="mt-2 inline-flex items-center gap-1 rounded text-sm font-medium text-brand-700 hover:text-brand-600 hover:underline"
            >
              Ver en la lista de alertas
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </>
        )}
      </section>
    </div>
  );
}
