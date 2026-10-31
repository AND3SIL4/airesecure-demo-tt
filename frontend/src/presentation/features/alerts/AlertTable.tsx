import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight } from 'lucide-react';
import { useEffect, useRef, type KeyboardEvent } from 'react';
import { parseSort, nextSort, type AlertSort, type AlertSortField } from '../../../domain/alertFilters';
import { formatRelative } from '../../../domain/format';
import { SEVERITY_META } from '../../../domain/severity';
import { ALERT_STATUS_META } from '../../../domain/status';
import type { AlertSummary } from '../../../domain/types';
import { ConfidenceMeter } from '../../components/ConfidenceMeter';
import { RelativeTime } from '../../components/RelativeTime';
import { SeverityBadge } from '../../components/SeverityBadge';
import { StatusBadge } from '../../components/StatusBadge';

export interface AlertTableProps {
  alerts: readonly AlertSummary[];
  sort: AlertSort;
  onSortChange: (sort: AlertSort) => void;
  onOpen: (id: string) => void;
  /** Id a resaltar 2 s (alerta recién reportada); además se desplaza hasta su fila. */
  highlightId?: string | null;
  /** Ids recién llegados en vivo a resaltar 2 s (sin desplazar la vista). */
  highlightIds?: ReadonlySet<string>;
  /** Descripción accesible de la tabla. */
  caption: string;
}

function rowLabel(alert: AlertSummary): string {
  return [
    `${alert.id}: ${alert.type.name}`,
    `severidad ${SEVERITY_META[alert.severity].label.toLowerCase()}`,
    `estado ${ALERT_STATUS_META[alert.status].label.toLowerCase()}`,
    alert.zone.name,
    `score ${alert.score}`,
    formatRelative(alert.detectedAt),
  ].join(', ') + '. Enter abre el detalle.';
}

const SORT_LABELS: Record<AlertSortField, string> = {
  severity: 'Prioridad',
  score: 'Score',
  detectedAt: 'Hora',
};

interface SortHeaderProps {
  field: AlertSortField;
  sort: AlertSort;
  onSortChange: (sort: AlertSort) => void;
  className?: string;
}

function SortHeader({ field, sort, onSortChange, className = '' }: SortHeaderProps) {
  const { field: activeField, direction } = parseSort(sort);
  const active = activeField === field;
  const Icon = !active ? ArrowUpDown : direction === 'desc' ? ArrowDown : ArrowUp;
  const ariaSort = !active ? 'none' : direction === 'desc' ? 'descending' : 'ascending';
  const nextDirection = active && direction === 'desc' ? 'ascendente' : 'descendente';
  return (
    <th scope="col" aria-sort={ariaSort} className={`px-3 py-2 ${className}`}>
      <button
        type="button"
        onClick={() => onSortChange(nextSort(sort, field))}
        className={`inline-flex items-center gap-1 rounded font-semibold hover:text-slate-900 ${active ? 'text-slate-900' : ''}`}
      >
        {SORT_LABELS[field]}
        <Icon aria-hidden="true" className="size-3.5" />
        <span className="sr-only">, ordenar en orden {nextDirection}</span>
      </button>
    </th>
  );
}

/** Tabla priorizada de alertas: filas enfocables (↑/↓ mueven el foco, Enter o clic abren el detalle). */
export function AlertTable({
  alerts,
  sort,
  onSortChange,
  onOpen,
  highlightId,
  highlightIds,
  caption,
}: AlertTableProps) {
  const highlightRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    highlightRef.current?.scrollIntoView({ block: 'nearest' });
  }, [highlightId]);

  const onRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, id: string) => {
    const row = event.currentTarget;
    if (event.key === 'Enter') {
      event.preventDefault();
      onOpen(id);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      (row.nextElementSibling as HTMLElement | null)?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      (row.previousElementSibling as HTMLElement | null)?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      (row.parentElement?.firstElementChild as HTMLElement | null)?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      (row.parentElement?.lastElementChild as HTMLElement | null)?.focus();
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-surface shadow-sm">
      <table className="w-full min-w-[56rem] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-600 uppercase">
          <tr>
            <SortHeader field="severity" sort={sort} onSortChange={onSortChange} />
            <th scope="col" className="px-3 py-2 font-semibold">ID</th>
            <th scope="col" className="px-3 py-2 font-semibold">Tipo</th>
            <th scope="col" className="px-3 py-2 font-semibold">Zona</th>
            <th scope="col" className="hidden px-3 py-2 font-semibold lg:table-cell">Fuente</th>
            <th scope="col" className="hidden px-3 py-2 font-semibold lg:table-cell">Confianza</th>
            <SortHeader field="score" sort={sort} onSortChange={onSortChange} />
            <th scope="col" className="px-3 py-2 font-semibold">Estado</th>
            <SortHeader field="detectedAt" sort={sort} onSortChange={onSortChange} />
            <th scope="col" className="w-8 px-2 py-2">
              <span className="sr-only">Abrir</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {alerts.map((alert) => {
            const scrollTarget = alert.id === highlightId;
            const highlighted = scrollTarget || (highlightIds?.has(alert.id) ?? false);
            return (
              <tr
                key={alert.id}
                ref={scrollTarget ? highlightRef : undefined}
                data-alert-id={alert.id}
                tabIndex={0}
                aria-label={rowLabel(alert)}
                onClick={() => onOpen(alert.id)}
                onKeyDown={(event) => onRowKeyDown(event, alert.id)}
                className={[
                  'cursor-pointer transition-colors duration-200 hover:bg-slate-50 focus-visible:bg-brand-600/5',
                  highlighted ? 'motion-safe:animate-row-highlight motion-reduce:bg-brand-600/10' : '',
                ].join(' ')}
              >
                <td className="px-3 py-2.5">
                  <SeverityBadge severity={alert.severity} size="sm" />
                </td>
                <td className="tabular px-3 py-2.5 font-medium whitespace-nowrap text-slate-900">{alert.id}</td>
                <td className="px-3 py-2.5 text-slate-800">{alert.type.name}</td>
                <td className="px-3 py-2.5 text-slate-700">{alert.zone.name}</td>
                <td className="hidden px-3 py-2.5 whitespace-nowrap text-slate-700 lg:table-cell">{alert.source.label}</td>
                <td className="hidden px-3 py-2.5 lg:table-cell">
                  <ConfidenceMeter value={alert.confidence} compact />
                </td>
                <td className="tabular px-3 py-2.5 font-semibold text-slate-900">{alert.score}</td>
                <td className="px-3 py-2.5">
                  <StatusBadge status={alert.status} size="sm" />
                </td>
                <td className="px-3 py-2.5 text-slate-700">
                  <RelativeTime value={alert.detectedAt} />
                </td>
                <td className="px-2 py-2.5 text-slate-400">
                  <ChevronRight aria-hidden="true" className="size-4" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
