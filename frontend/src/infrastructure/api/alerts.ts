// Alertas de la API (specs/002-alertas/contracts/api-alerts.md). Funciones sin estado sobre http.ts.
import { ALERTS_PAGE_SIZE, type AlertFilters } from '../../domain/alertFilters';
import type {
  AlertActionBody,
  AlertDetail,
  AlertSummary,
  ConfirmAlertResult,
  ManualAlertBody,
  Page,
} from '../../domain/types';
import { http } from '../http';

function toQuery(filters: AlertFilters, pageSize: number): string {
  const params = new URLSearchParams();
  params.set('status', filters.status === 'activas' ? 'activas' : filters.status.join(','));
  if (filters.severity.length) params.set('severity', filters.severity.join(','));
  if (filters.zone.length) params.set('zone', filters.zone.join(','));
  if (filters.type.length) params.set('type', filters.type.join(','));
  if (filters.source.length) params.set('source', filters.source.join(','));
  if (filters.q) params.set('q', filters.q);
  params.set('sort', filters.sort);
  params.set('page', String(filters.page));
  params.set('pageSize', String(pageSize));
  return params.toString();
}

export function getAlerts(filters: AlertFilters, pageSize: number = ALERTS_PAGE_SIZE) {
  return http.get<Page<AlertSummary>>(`/alerts?${toQuery(filters, pageSize)}`);
}

export function getAlert(id: string) {
  return http.get<AlertDetail>(`/alerts/${encodeURIComponent(id)}`);
}

/** `confirm` responde `{ alert, incident }`; el resto, el detalle actualizado. */
export function postAlertAction(id: string, body: AlertActionBody) {
  return http.post<AlertDetail | ConfirmAlertResult>(`/alerts/${encodeURIComponent(id)}/actions`, body);
}

export function postManualAlert(body: ManualAlertBody) {
  return http.post<AlertDetail>('/alerts', body);
}

/** Total de alertas activas (nueva + en revisión): reutiliza el listado con `pageSize=1`. */
export async function getActiveAlertsTotal(): Promise<number> {
  const page = await http.get<Page<AlertSummary>>('/alerts?status=activas&pageSize=1');
  return page.total;
}

/** Total de alertas críticas activas para el botón "Críticas (N)" (`pageSize=1`). */
export async function getCriticalTotal(): Promise<number> {
  const page = await http.get<Page<AlertSummary>>('/alerts?status=activas&severity=critica&pageSize=1');
  return page.total;
}
