import { Search, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import {
  ACTIVE_STATUS_SHORTCUT,
  clearAlertFilters,
  hasActiveFilters,
  type AlertFilters,
} from '../../domain/alertFilters';
import { SEVERITIES, SEVERITY_META } from '../../domain/severity';
import { ALERT_STATUSES, ALERT_STATUS_META } from '../../domain/status';
import type { AlertStatus, AlertTypeRef, Severity, SourceRef, ZoneRef } from '../../domain/types';
import { Button } from './Button';
import { MultiSelect, type MultiSelectOption } from './MultiSelect';
import { SeverityBadge } from './SeverityBadge';
import { StatusBadge } from './StatusBadge';

const SEARCH_DEBOUNCE_MS = 300;
const ACTIVE_LABEL = 'Activas';

export interface FilterBarProps {
  filters: AlertFilters;
  onChange: (filters: AlertFilters) => void;
  zones: readonly ZoneRef[];
  alertTypes: readonly AlertTypeRef[];
  sources: readonly SourceRef[];
}

interface Chip {
  key: string;
  label: string;
  remove: () => AlertFilters;
}

const STATUS_OPTIONS: MultiSelectOption[] = [
  { value: ACTIVE_STATUS_SHORTCUT, label: `${ACTIVE_LABEL} (nuevas y en revisión)` },
  ...ALERT_STATUSES.map((s) => ({
    value: s,
    label: ALERT_STATUS_META[s].label,
    content: <StatusBadge status={s} size="sm" />,
  })),
];

const SEVERITY_OPTIONS: MultiSelectOption[] = SEVERITIES.map((s) => ({
  value: s,
  label: SEVERITY_META[s].label,
  content: <SeverityBadge severity={s} size="sm" />,
}));

/** Barra de filtros de alertas controlada por `AlertFilters` (la página la sincroniza con la URL). */
export function FilterBar({ filters, onChange, zones, alertTypes, sources }: FilterBarProps) {
  const searchId = useId();
  const [text, setText] = useState(filters.q);
  const [syncedQ, setSyncedQ] = useState(filters.q);

  // Si la URL cambia desde fuera (chips, "Limpiar filtros", atrás), el campo se sincroniza.
  if (filters.q !== syncedQ) {
    setSyncedQ(filters.q);
    if (text.trim() !== filters.q) setText(filters.q);
  }

  // Últimos valores para el debounce sin reiniciar el temporizador en cada render.
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

  const update = (patch: Partial<AlertFilters>) => onChange({ ...filters, ...patch, page: 1 });

  const statusSelected = filters.status === ACTIVE_STATUS_SHORTCUT ? [ACTIVE_STATUS_SHORTCUT] : filters.status;
  const onStatusChange = (values: string[]) => {
    const pickedActive = values.includes(ACTIVE_STATUS_SHORTCUT) && !statusSelected.includes(ACTIVE_STATUS_SHORTCUT);
    const explicit = values.filter((v): v is AlertStatus => v !== ACTIVE_STATUS_SHORTCUT);
    update({ status: pickedActive || explicit.length === 0 ? ACTIVE_STATUS_SHORTCUT : explicit });
  };

  const zoneOptions = zones.map((z) => ({ value: z.id, label: z.name }));
  const typeOptions = alertTypes.map((t) => ({ value: t.code, label: t.name }));
  const sourceOptions = sources.map((s) => ({ value: s.id, label: s.label }));
  const nameOf = (options: MultiSelectOption[], value: string) =>
    options.find((o) => o.value === value)?.label ?? value;

  const chips: Chip[] = [];
  if (filters.status !== ACTIVE_STATUS_SHORTCUT) {
    for (const s of filters.status) {
      chips.push({
        key: `status-${s}`,
        label: `Estado: ${ALERT_STATUS_META[s].label}`,
        remove: () => {
          const rest = (filters.status as AlertStatus[]).filter((v) => v !== s);
          return { ...filters, status: rest.length ? rest : ACTIVE_STATUS_SHORTCUT, page: 1 };
        },
      });
    }
  }
  for (const s of filters.severity) {
    chips.push({
      key: `severity-${s}`,
      label: `Severidad: ${SEVERITY_META[s].label}`,
      remove: () => ({ ...filters, severity: filters.severity.filter((v): v is Severity => v !== s), page: 1 }),
    });
  }
  const listChips = (field: 'zone' | 'type' | 'source', title: string, options: MultiSelectOption[]) => {
    for (const value of filters[field]) {
      chips.push({
        key: `${field}-${value}`,
        label: `${title}: ${nameOf(options, value)}`,
        remove: () => ({ ...filters, [field]: filters[field].filter((v) => v !== value), page: 1 }),
      });
    }
  };
  listChips('zone', 'Zona', zoneOptions);
  listChips('type', 'Tipo', typeOptions);
  listChips('source', 'Fuente', sourceOptions);
  if (filters.q) {
    chips.push({ key: 'q', label: `Búsqueda: "${filters.q}"`, remove: () => ({ ...filters, q: '', page: 1 }) });
  }

  const filtered = hasActiveFilters(filters);

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-surface p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <label htmlFor={searchId} className="sr-only">
            Buscar por ID o descripción
          </label>
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" />
          <input
            id={searchId}
            type="search"
            value={text}
            maxLength={100}
            onChange={(event) => setText(event.target.value)}
            placeholder="Buscar por ID o descripción"
            className="h-9 w-full rounded-md border border-slate-300 bg-surface pr-3 pl-9 text-sm placeholder:text-slate-500"
          />
        </div>
        <MultiSelect
          label="Estado"
          options={STATUS_OPTIONS}
          selected={statusSelected}
          onChange={onStatusChange}
        />
        <MultiSelect
          label="Severidad"
          options={SEVERITY_OPTIONS}
          selected={filters.severity}
          onChange={(values) => update({ severity: values as Severity[] })}
        />
        <MultiSelect label="Zona" options={zoneOptions} selected={filters.zone} onChange={(zone) => update({ zone })} />
        <MultiSelect label="Tipo" options={typeOptions} selected={filters.type} onChange={(type) => update({ type })} />
        <MultiSelect
          label="Fuente"
          options={sourceOptions}
          selected={filters.source}
          onChange={(source) => update({ source })}
        />
        {filtered && (
          <Button variant="ghost" size="sm" onClick={() => onChange(clearAlertFilters(filters))}>
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
