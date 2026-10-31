import { Search, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import {
  IN_COURSE_SHORTCUT,
  clearIncidentFilters,
  hasActiveIncidentFilters,
  type IncidentFilters,
} from '../../../domain/incidentFilters';
import { DATE_RANGE_LABELS, DEFAULT_DATE_RANGE } from '../../../domain/dateRanges';
import { SEVERITIES, SEVERITY_META } from '../../../domain/severity';
import { INCIDENT_STATUSES, INCIDENT_STATUS_META } from '../../../domain/status';
import type { AlertTypeRef, IncidentStatus, Severity, ZoneRef } from '../../../domain/types';
import { Button } from '../../components/Button';
import { DateRangePresets } from '../../components/DateRangePresets';
import { MultiSelect, type MultiSelectOption } from '../../components/MultiSelect';
import { SeverityBadge } from '../../components/SeverityBadge';
import { StatusBadge } from '../../components/StatusBadge';

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_LABEL = 'Buscar por INC, ALT o descripción';

export interface IncidentFilterBarProps {
  filters: IncidentFilters;
  onChange: (filters: IncidentFilters) => void;
  zones: readonly ZoneRef[];
  alertTypes: readonly AlertTypeRef[];
}

interface Chip {
  key: string;
  label: string;
  remove: () => IncidentFilters;
}

const STATUS_OPTIONS: MultiSelectOption[] = [
  {
    value: IN_COURSE_SHORTCUT,
    label: 'En curso (abierto, en atención y escalado)',
  },
  ...INCIDENT_STATUSES.map((s) => ({
    value: s,
    label: INCIDENT_STATUS_META[s].label,
    content: <StatusBadge status={s} size="sm" />,
  })),
];

const SEVERITY_OPTIONS: MultiSelectOption[] = SEVERITIES.map((s) => ({
  value: s,
  label: SEVERITY_META[s].label,
  content: <SeverityBadge severity={s} size="sm" />,
}));

function shortDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-');
  return `${day}/${month}/${year}`;
}

function rangeChipLabel(filters: IncidentFilters): string {
  if (filters.range !== 'custom') return `Fechas: ${DATE_RANGE_LABELS[filters.range]}`;
  if (filters.from && filters.to) return `Fechas: ${shortDate(filters.from)} – ${shortDate(filters.to)}`;
  if (filters.from) return `Fechas: desde ${shortDate(filters.from)}`;
  if (filters.to) return `Fechas: hasta ${shortDate(filters.to)}`;
  return 'Fechas: personalizado';
}

/** Barra de filtros del registro de incidentes; la página la sincroniza con la URL. */
export function IncidentFilterBar({ filters, onChange, zones, alertTypes }: IncidentFilterBarProps) {
  const searchId = useId();
  const [text, setText] = useState(filters.q);
  const [syncedQ, setSyncedQ] = useState(filters.q);

  // Si la URL cambia desde fuera (chips, "Limpiar filtros", atrás), el campo se sincroniza.
  if (filters.q !== syncedQ) {
    setSyncedQ(filters.q);
    if (text.trim() !== filters.q) setText(filters.q);
  }

  const latest = useRef({ filters, onChange });
  useEffect(() => {
    latest.current = { filters, onChange };
  });

  useEffect(() => {
    const trimmed = text.trim();
    if (trimmed === latest.current.filters.q) return;
    const timer = setTimeout(() => {
      const current = latest.current;
      current.onChange({ ...current.filters, q: trimmed, page: 1 });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text]);

  const update = (patch: Partial<IncidentFilters>) => onChange({ ...filters, ...patch, page: 1 });

  const statusSelected: string[] = filters.status === IN_COURSE_SHORTCUT ? [IN_COURSE_SHORTCUT] : filters.status;
  const onStatusChange = (values: string[]) => {
    const pickedInCourse = values.includes(IN_COURSE_SHORTCUT) && !statusSelected.includes(IN_COURSE_SHORTCUT);
    const explicit = values.filter((v): v is IncidentStatus => v !== IN_COURSE_SHORTCUT);
    update({ status: pickedInCourse ? IN_COURSE_SHORTCUT : explicit });
  };

  const zoneOptions = zones.map((z) => ({ value: z.id, label: z.name }));
  const typeOptions = alertTypes.map((t) => ({ value: t.code, label: t.name }));
  const nameOf = (options: MultiSelectOption[], value: string) =>
    options.find((o) => o.value === value)?.label ?? value;

  const chips: Chip[] = [];
  if (filters.range !== DEFAULT_DATE_RANGE) {
    chips.push({
      key: 'range',
      label: rangeChipLabel(filters),
      remove: () => ({
        ...filters,
        range: DEFAULT_DATE_RANGE,
        from: '',
        to: '',
        page: 1,
      }),
    });
  }
  if (filters.status === IN_COURSE_SHORTCUT) {
    chips.push({
      key: 'status-en-curso',
      label: 'Estado: En curso',
      remove: () => ({ ...filters, status: [], page: 1 }),
    });
  } else {
    for (const s of filters.status) {
      chips.push({
        key: `status-${s}`,
        label: `Estado: ${INCIDENT_STATUS_META[s].label}`,
        remove: () => ({
          ...filters,
          status: (filters.status as IncidentStatus[]).filter((v) => v !== s),
          page: 1,
        }),
      });
    }
  }
  for (const s of filters.severity) {
    chips.push({
      key: `severity-${s}`,
      label: `Severidad: ${SEVERITY_META[s].label}`,
      remove: () => ({
        ...filters,
        severity: filters.severity.filter((v): v is Severity => v !== s),
        page: 1,
      }),
    });
  }
  const listChips = (field: 'zone' | 'type', title: string, options: MultiSelectOption[]) => {
    for (const value of filters[field]) {
      chips.push({
        key: `${field}-${value}`,
        label: `${title}: ${nameOf(options, value)}`,
        remove: () => ({
          ...filters,
          [field]: filters[field].filter((v) => v !== value),
          page: 1,
        }),
      });
    }
  };
  listChips('zone', 'Zona', zoneOptions);
  listChips('type', 'Tipo', typeOptions);
  if (filters.q) {
    chips.push({
      key: 'q',
      label: `Búsqueda: "${filters.q}"`,
      remove: () => ({ ...filters, q: '', page: 1 }),
    });
  }

  const filtered = hasActiveIncidentFilters(filters);

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-surface p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <label htmlFor={searchId} className="sr-only">
            {SEARCH_LABEL}
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500"
          />
          <input
            id={searchId}
            type="search"
            value={text}
            maxLength={100}
            onChange={(event) => setText(event.target.value)}
            placeholder={SEARCH_LABEL}
            className="h-9 w-full rounded-md border border-slate-300 bg-surface pr-3 pl-9 text-sm placeholder:text-slate-500"
          />
        </div>
        <DateRangePresets
          value={{ range: filters.range, from: filters.from, to: filters.to }}
          onChange={(range) => update(range)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <MultiSelect label="Estado" options={STATUS_OPTIONS} selected={statusSelected} onChange={onStatusChange} />
        <MultiSelect
          label="Severidad"
          options={SEVERITY_OPTIONS}
          selected={filters.severity}
          onChange={(values) => update({ severity: values as Severity[] })}
        />
        <MultiSelect label="Zona" options={zoneOptions} selected={filters.zone} onChange={(zone) => update({ zone })} />
        <MultiSelect label="Tipo" options={typeOptions} selected={filters.type} onChange={(type) => update({ type })} />
        {filtered && (
          <Button variant="ghost" size="sm" onClick={() => onChange(clearIncidentFilters(filters))}>
            Limpiar filtros
          </Button>
        )}
      </div>

      {chips.length > 0 && (
        <ul aria-label="Filtros activos" className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <li key={chip.key}>
              <button
                type="button"
                onClick={() => onChange(chip.remove())}
                aria-label={`Quitar filtro ${chip.label}`}
                className="inline-flex h-7 items-center gap-1 rounded-full border border-brand-600/30 bg-brand-600/10 pr-2 pl-3 text-xs font-medium text-brand-700 hover:bg-brand-600/20"
              >
                {chip.label}
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
