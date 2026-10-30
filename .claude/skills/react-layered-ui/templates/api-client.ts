// Plantilla: infrastructure/api/alerts.ts — funciones sin estado sobre http.ts
import { http } from '../http';
import type { AlertDetail, AlertSummary, Page, AlertFilters, AlertActionBody } from '../../domain/types';

export function getAlerts(filters: AlertFilters, page = 1, pageSize = 20) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) return;
    params.set(k, Array.isArray(v) ? v.join(',') : String(v));
  });
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));
  return http.get<Page<AlertSummary>>(`/api/alerts?${params}`);
}

export function getAlert(id: string) {
  return http.get<AlertDetail>(`/api/alerts/${id}`);
}

export function postAlertAction(id: string, body: AlertActionBody) {
  return http.post<AlertDetail>(`/api/alerts/${id}/actions`, body);
}
