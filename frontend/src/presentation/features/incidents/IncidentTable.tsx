import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { formatDuration, formatRelative } from '../../../domain/format';
import {
  nextIncidentSort,
  parseIncidentSort,
  type IncidentSort,
  type IncidentSortField,
} from '../../../domain/incidentFilters';
import { SEVERITY_META } from '../../../domain/severity';
import { INCIDENT_STATUS_META } from '../../../domain/status';
import type { Incident } from '../../../domain/types';
import { RelativeTime } from '../../components/RelativeTime';
import { SeverityBadge } from '../../components/SeverityBadge';
import { StatusBadge } from '../../components/StatusBadge';

export interface IncidentTableProps {
  incidents: readonly Incident[];
  sort: IncidentSort;
  onSortChange: (sort: IncidentSort) => void;
  onOpen: (id: string) => void;
  /** Descripción accesible de la tabla. */
  caption: string;
}

const EMPTY_TIME = '—';

function durationCell(seconds: number | null): string {
  return seconds === null ? EMPTY_TIME : formatDuration(seconds);
}

function rowLabel(incident: Incident): string {
  return (
    [
      `${incident.id}: ${incident.alert.type.name}`,
      `alerta ${incident.alert.id}`,
      `severidad ${SEVERITY_META[incident.alert.severity].label.toLowerCase()}`,
      `estado ${INCIDENT_STATUS_META[incident.status].label.toLowerCase()}`,
      incident.alert.zone.name,
      incident.team ? `equipo ${incident.team.name}` : 'sin equipo',
      `abierto ${formatRelative(incident.openedAt)}`,
      `tiempo de respuesta ${incident.responseSeconds === null ? 'sin dato' : formatDuration(incident.responseSeconds)}`,
      `tiempo de resolución ${incident.resolutionSeconds === null ? 'sin dato' : formatDuration(incident.resolutionSeconds)}`,
    ].join(', ') + '. Enter abre el detalle.'
  );
}

const SORT_LABELS: Record<IncidentSortField, string> = {
  openedAt: 'Abierto',
  severity: 'Severidad',
  responseSeconds: 'T. respuesta',
};

interface SortHeaderProps {
  field: IncidentSortField;
  sort: IncidentSort;
  onSortChange: (sort: IncidentSort) => void;
}

function SortHeader({ field, sort, onSortChange }: SortHeaderProps) {
  const { field: activeField, direction } = parseIncidentSort(sort);
  const active = activeField === field;
  const Icon = !active ? ArrowUpDown : direction === 'desc' ? ArrowDown : ArrowUp;
  const ariaSort = !active ? 'none' : direction === 'desc' ? 'descending' : 'ascending';
  const nextDirection = active && direction === 'desc' ? 'ascendente' : 'descendente';
  return (
    <th scope="col" aria-sort={ariaSort} className="px-2 py-2">
      <button
        type="button"
        onClick={() => onSortChange(nextIncidentSort(sort, field))}
        className={`inline-flex items-center gap-1 rounded font-semibold whitespace-nowrap uppercase hover:text-slate-900 ${active ? 'text-slate-900' : ''}`}
      >
        {SORT_LABELS[field]}
        <Icon aria-hidden="true" className="size-3.5" />
        <span className="sr-only">, ordenar en orden {nextDirection}</span>
      </button>
    </th>
  );
}

/** Registro de incidentes: filas enfocables (↑/↓ mueven el foco, Enter o clic abren el detalle). */
export function IncidentTable({ incidents, sort, onSortChange, onOpen, caption }: IncidentTableProps) {
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

  // `relative`: los textos sr-only (absolutos) de la tabla quedan dentro del scroll y no desbordan la página.
  return (
    <div className="relative overflow-x-auto rounded-lg border border-slate-200 bg-surface shadow-sm">
      <table className="w-full min-w-[46rem] text-left text-sm lg:min-w-[52rem]">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-600 uppercase">
          <tr>
            <th scope="col" className="px-2 py-2 font-semibold">
              ID
            </th>
            <th scope="col" className="hidden px-2 py-2 font-semibold whitespace-nowrap 2xl:table-cell">
              Alerta de origen
            </th>
            <th scope="col" className="px-2 py-2 font-semibold">
              Tipo
            </th>
            <SortHeader field="severity" sort={sort} onSortChange={onSortChange} />
            <th scope="col" className="px-2 py-2 font-semibold">
              Zona
            </th>
            <th scope="col" className="px-2 py-2 font-semibold">
              Estado
            </th>
            <th scope="col" className="px-2 py-2 font-semibold">
              Equipo
            </th>
            <SortHeader field="openedAt" sort={sort} onSortChange={onSortChange} />
            <SortHeader field="responseSeconds" sort={sort} onSortChange={onSortChange} />
            <th scope="col" className="hidden px-2 py-2 font-semibold whitespace-nowrap lg:table-cell">
              T. resolución
            </th>
            <th scope="col" className="w-8 px-2 py-2">
              <span className="sr-only">Abrir</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {incidents.map((incident) => (
            <tr
              key={incident.id}
              data-incident-id={incident.id}
              tabIndex={0}
              aria-label={rowLabel(incident)}
              onClick={() => onOpen(incident.id)}
              onKeyDown={(event) => onRowKeyDown(event, incident.id)}
              className="cursor-pointer transition-colors duration-200 hover:bg-slate-50 focus-visible:bg-brand-600/5"
            >
              <td className="tabular px-2 py-2.5 font-medium whitespace-nowrap text-slate-900">{incident.id}</td>
              <td className="tabular hidden px-2 py-2.5 whitespace-nowrap text-slate-700 2xl:table-cell">
                {incident.alert.id}
              </td>
              <td className="min-w-[8rem] px-2 py-2.5 break-words text-slate-800">{incident.alert.type.name}</td>
              <td className="px-2 py-2.5">
                <SeverityBadge severity={incident.alert.severity} size="sm" />
              </td>
              <td className="min-w-[7rem] px-2 py-2.5 break-words text-slate-700">{incident.alert.zone.name}</td>
              <td className="px-2 py-2.5">
                <StatusBadge status={incident.status} size="sm" />
              </td>
              <td className="min-w-[7rem] px-2 py-2.5 break-words text-slate-700">
                {incident.team?.name ?? EMPTY_TIME}
              </td>
              <td className="px-2 py-2.5 whitespace-nowrap text-slate-700">
                <RelativeTime value={incident.openedAt} />
              </td>
              <td className="tabular px-2 py-2.5 whitespace-nowrap text-slate-700">
                {durationCell(incident.responseSeconds)}
              </td>
              <td className="tabular hidden px-2 py-2.5 whitespace-nowrap text-slate-700 lg:table-cell">
                {durationCell(incident.resolutionSeconds)}
              </td>
              <td className="px-2 py-2.5 text-slate-400">
                <ChevronRight aria-hidden="true" className="size-4" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
