// Filtros del registro de incidentes y su (de)serialización en la URL (contracts/ui-incidents.md).
// Los valores inválidos se ignoran; por defecto: todos los estados, últimos 30 días, `openedAt:desc`.
import { DEFAULT_DATE_RANGE, isDateRangePreset, type DateRangePreset } from './dateRanges';
import type { IncidentStatus, Severity } from './types';

export const INCIDENT_SORTS = [
  'openedAt:desc',
  'openedAt:asc',
  'severity:desc',
  'severity:asc',
  'responseSeconds:desc',
  'responseSeconds:asc',
] as const;

export type IncidentSort = (typeof INCIDENT_SORTS)[number];
export type IncidentSortField = 'openedAt' | 'severity' | 'responseSeconds';
export type IncidentSortDirection = 'asc' | 'desc';

export const DEFAULT_INCIDENT_SORT: IncidentSort = 'openedAt:desc';
export const INCIDENTS_PAGE_SIZE = 20;
/** Atajo de la API: abierto + en atención + escalado. */
export const IN_COURSE_SHORTCUT = 'en_curso';

export interface IncidentFilters {
  /** 'en_curso' o una lista explícita de estados (vacía = todos). */
  status: IncidentStatus[] | typeof IN_COURSE_SHORTCUT;
  severity: Severity[];
  zone: string[];
  type: string[];
  q: string;
  range: DateRangePreset;
  /** Solo con `range = 'custom'`: fechas `YYYY-MM-DD` (America/Bogota). */
  from: string;
  to: string;
  sort: IncidentSort;
  page: number;
}

export const DEFAULT_INCIDENT_FILTERS: IncidentFilters = {
  status: [],
  severity: [],
  zone: [],
  type: [],
  q: '',
  range: DEFAULT_DATE_RANGE,
  from: '',
  to: '',
  sort: DEFAULT_INCIDENT_SORT,
  page: 1,
};

const STATUS_VALUES: readonly IncidentStatus[] = ['abierto', 'en_atencion', 'escalado', 'resuelto'];
const SEVERITY_VALUES: readonly Severity[] = ['critica', 'alta', 'media', 'baja'];
const CATALOG_ID = /^[A-Za-z0-9_-]{1,32}$/;
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_QUERY_LENGTH = 100;

function splitList(raw: string | null): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  for (const part of raw.split(',')) {
    const value = part.trim();
    if (value) seen.add(value);
  }
  return [...seen];
}

function pick<T extends string>(raw: string | null, allowed: readonly T[]): T[] {
  return splitList(raw).filter((v): v is T => (allowed as readonly string[]).includes(v));
}

function isSort(value: string | null): value is IncidentSort {
  return value !== null && (INCIDENT_SORTS as readonly string[]).includes(value);
}

function validDateKey(raw: string | null): string {
  if (!raw || !DATE_KEY.test(raw)) return '';
  return Number.isNaN(new Date(`${raw}T00:00:00Z`).getTime()) ? '' : raw;
}

export function parseIncidentFilters(params: URLSearchParams): IncidentFilters {
  const rawStatus = params.get('status');
  const pageNumber = Number.parseInt(params.get('page') ?? '', 10);
  const sort = params.get('sort');
  const range = params.get('range');
  const isCustom = range === 'custom';

  return {
    status: rawStatus === IN_COURSE_SHORTCUT ? IN_COURSE_SHORTCUT : pick(rawStatus, STATUS_VALUES),
    severity: pick(params.get('severity'), SEVERITY_VALUES),
    zone: splitList(params.get('zone')).filter((v) => CATALOG_ID.test(v)),
    type: splitList(params.get('type')).filter((v) => CATALOG_ID.test(v)),
    q: (params.get('q') ?? '').trim().slice(0, MAX_QUERY_LENGTH),
    range: isDateRangePreset(range) ? range : DEFAULT_DATE_RANGE,
    from: isCustom ? validDateKey(params.get('from')) : '',
    to: isCustom ? validDateKey(params.get('to')) : '',
    sort: isSort(sort) ? sort : DEFAULT_INCIDENT_SORT,
    page: Number.isFinite(pageNumber) && pageNumber >= 1 ? pageNumber : 1,
  };
}

/** Serializa solo lo que difiere de los valores por defecto. */
export function incidentFiltersToSearchParams(filters: IncidentFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.status === IN_COURSE_SHORTCUT) params.set('status', IN_COURSE_SHORTCUT);
  else if (filters.status.length) params.set('status', filters.status.join(','));
  if (filters.severity.length) params.set('severity', filters.severity.join(','));
  if (filters.zone.length) params.set('zone', filters.zone.join(','));
  if (filters.type.length) params.set('type', filters.type.join(','));
  if (filters.q) params.set('q', filters.q);
  if (filters.range !== DEFAULT_DATE_RANGE) params.set('range', filters.range);
  if (filters.range === 'custom') {
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
  }
  if (filters.sort !== DEFAULT_INCIDENT_SORT) params.set('sort', filters.sort);
  if (filters.page > 1) params.set('page', String(filters.page));
  return params;
}

/** True si hay algún filtro distinto del predeterminado (el orden y la página no cuentan). */
export function hasActiveIncidentFilters(filters: IncidentFilters): boolean {
  return (
    filters.status === IN_COURSE_SHORTCUT ||
    filters.status.length > 0 ||
    filters.severity.length > 0 ||
    filters.zone.length > 0 ||
    filters.type.length > 0 ||
    filters.q !== '' ||
    filters.range !== DEFAULT_DATE_RANGE
  );
}

/** Restablece los filtros conservando el orden elegido. */
export function clearIncidentFilters(filters: IncidentFilters): IncidentFilters {
  return { ...DEFAULT_INCIDENT_FILTERS, sort: filters.sort };
}

export function parseIncidentSort(sort: IncidentSort): {
  field: IncidentSortField;
  direction: IncidentSortDirection;
} {
  const [field, direction] = sort.split(':') as [IncidentSortField, IncidentSortDirection];
  return { field, direction };
}

/** Al pulsar un encabezado: invierte la dirección si ya es la columna activa; si no, descendente. */
export function nextIncidentSort(current: IncidentSort, field: IncidentSortField): IncidentSort {
  const { field: currentField, direction } = parseIncidentSort(current);
  if (currentField === field) return `${field}:${direction === 'desc' ? 'asc' : 'desc'}`;
  return `${field}:desc`;
}
