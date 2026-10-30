// Filtros de la lista de alertas y su (de)serialización en la URL (contracts/ui-alerts.md).
// Los valores inválidos se ignoran; el estado por defecto es 'activas' (= nueva + en_revision).
import type { AlertStatus, Severity } from './types';

export const ALERT_SORTS = [
  'score:desc',
  'score:asc',
  'detectedAt:desc',
  'detectedAt:asc',
  'severity:desc',
  'severity:asc',
] as const;

export type AlertSort = (typeof ALERT_SORTS)[number];
export type AlertSortField = 'score' | 'detectedAt' | 'severity';
export type SortDirection = 'asc' | 'desc';

export const DEFAULT_SORT: AlertSort = 'score:desc';
export const ALERTS_PAGE_SIZE = 20;
export const ACTIVE_STATUS_SHORTCUT = 'activas';

export interface AlertFilters {
  /** 'activas' o una lista explícita de estados. */
  status: AlertStatus[] | typeof ACTIVE_STATUS_SHORTCUT;
  severity: Severity[];
  zone: string[];
  type: string[];
  source: string[];
  q: string;
  sort: AlertSort;
  page: number;
}

export const DEFAULT_ALERT_FILTERS: AlertFilters = {
  status: ACTIVE_STATUS_SHORTCUT,
  severity: [],
  zone: [],
  type: [],
  source: [],
  q: '',
  sort: DEFAULT_SORT,
  page: 1,
};

const STATUS_VALUES: readonly AlertStatus[] = ['nueva', 'en_revision', 'confirmada', 'descartada'];
const SEVERITY_VALUES: readonly Severity[] = ['critica', 'alta', 'media', 'baja'];
/** IDs y códigos de catálogo: letras, números, guion y guion bajo. */
const CATALOG_ID = /^[A-Za-z0-9_-]{1,32}$/;
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

function isSort(value: string | null): value is AlertSort {
  return value !== null && (ALERT_SORTS as readonly string[]).includes(value);
}

export function parseAlertFilters(params: URLSearchParams): AlertFilters {
  const rawStatus = params.get('status');
  const statuses = pick(rawStatus, STATUS_VALUES);
  const pageNumber = Number.parseInt(params.get('page') ?? '', 10);
  const sort = params.get('sort');

  return {
    status: statuses.length > 0 ? statuses : ACTIVE_STATUS_SHORTCUT,
    severity: pick(params.get('severity'), SEVERITY_VALUES),
    zone: splitList(params.get('zone')).filter((v) => CATALOG_ID.test(v)),
    type: splitList(params.get('type')).filter((v) => CATALOG_ID.test(v)),
    source: splitList(params.get('source')).filter((v) => CATALOG_ID.test(v)),
    q: (params.get('q') ?? '').trim().slice(0, MAX_QUERY_LENGTH),
    sort: isSort(sort) ? sort : DEFAULT_SORT,
    page: Number.isFinite(pageNumber) && pageNumber >= 1 ? pageNumber : 1,
  };
}

/** Serializa solo lo que difiere de los valores por defecto (URLs cortas y compartibles). */
export function toSearchParams(filters: AlertFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.status !== ACTIVE_STATUS_SHORTCUT && filters.status.length > 0) {
    params.set('status', filters.status.join(','));
  }
  if (filters.severity.length) params.set('severity', filters.severity.join(','));
  if (filters.zone.length) params.set('zone', filters.zone.join(','));
  if (filters.type.length) params.set('type', filters.type.join(','));
  if (filters.source.length) params.set('source', filters.source.join(','));
  if (filters.q) params.set('q', filters.q);
  if (filters.sort !== DEFAULT_SORT) params.set('sort', filters.sort);
  if (filters.page > 1) params.set('page', String(filters.page));
  return params;
}

/** True si hay algún filtro distinto del predeterminado (el orden y la página no cuentan). */
export function hasActiveFilters(filters: AlertFilters): boolean {
  return (
    filters.status !== ACTIVE_STATUS_SHORTCUT ||
    filters.severity.length > 0 ||
    filters.zone.length > 0 ||
    filters.type.length > 0 ||
    filters.source.length > 0 ||
    filters.q !== ''
  );
}

/** Restablece los filtros conservando el orden elegido. */
export function clearAlertFilters(filters: AlertFilters): AlertFilters {
  return { ...DEFAULT_ALERT_FILTERS, sort: filters.sort };
}

export function parseSort(sort: AlertSort): { field: AlertSortField; direction: SortDirection } {
  const [field, direction] = sort.split(':') as [AlertSortField, SortDirection];
  return { field, direction };
}

/** Al pulsar un encabezado: invierte la dirección si ya es la columna activa; si no, descendente. */
export function nextSort(current: AlertSort, field: AlertSortField): AlertSort {
  const { field: currentField, direction } = parseSort(current);
  if (currentField === field) return `${field}:${direction === 'desc' ? 'asc' : 'desc'}`;
  return `${field}:desc`;
}

export function totalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}
