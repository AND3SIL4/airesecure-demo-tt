// Reportes de la API (contracts/api-analytics.md · GET /api/reports/incidents.csv, solo supervisor).
import type { IncidentFilters } from '../../domain/incidentFilters';
import { downloadFile } from '../download';
import { incidentFilterParams } from './incidents';

const CSV_FALLBACK_NAME = 'incidentes.csv';

/** Descarga el CSV con los mismos filtros del registro (sin paginar). Devuelve el nombre del archivo. */
export function downloadIncidentsCsv(filters: IncidentFilters) {
  return downloadFile(`/reports/incidents.csv?${incidentFilterParams(filters).toString()}`, CSV_FALLBACK_NAME);
}
