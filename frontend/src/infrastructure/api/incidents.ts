// Incidentes de la API (specs/004-incidentes/contracts/api-incidents.md). Funciones sin estado sobre http.ts.
import { INCIDENTS_PAGE_SIZE, IN_COURSE_SHORTCUT, type IncidentFilters } from '../../domain/incidentFilters';
import { resolveDateRange } from '../../domain/dateRanges';
import type { IncidentActionBody, IncidentDetail, IncidentPage } from '../../domain/types';
import { http } from '../http';

/** Parámetros de filtro y orden comunes al listado y al CSV (sin `page` ni `pageSize`). */
export function incidentFilterParams(filters: IncidentFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.status === IN_COURSE_SHORTCUT) params.set('status', IN_COURSE_SHORTCUT);
  else if (filters.status.length) params.set('status', filters.status.join(','));
  if (filters.severity.length) params.set('severity', filters.severity.join(','));
  if (filters.zone.length) params.set('zone', filters.zone.join(','));
  if (filters.type.length) params.set('type', filters.type.join(','));
  if (filters.q) params.set('q', filters.q);
  const { from, to } = resolveDateRange(filters);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  params.set('sort', filters.sort);
  return params;
}

function toQuery(filters: IncidentFilters, pageSize: number): string {
  const params = incidentFilterParams(filters);
  params.set('page', String(filters.page));
  params.set('pageSize', String(pageSize));
  return params.toString();
}

export function getIncidents(filters: IncidentFilters, pageSize: number = INCIDENTS_PAGE_SIZE) {
  return http.get<IncidentPage>(`/incidents?${toQuery(filters, pageSize)}`);
}

export function getIncident(id: string) {
  return http.get<IncidentDetail>(`/incidents/${encodeURIComponent(id)}`);
}

export function postIncidentAction(id: string, body: IncidentActionBody) {
  return http.post<IncidentDetail>(`/incidents/${encodeURIComponent(id)}/actions`, body);
}

/** Total de incidentes en curso (abierto + en atención + escalado): el listado con `pageSize=1`. */
export async function getIncidentsInCourseTotal(): Promise<number> {
  const page = await http.get<IncidentPage>(`/incidents?status=${IN_COURSE_SHORTCUT}&pageSize=1`);
  return page.total;
}
