// Reportes y exportación CSV de incidentes (doc 09 §3.5 y §3.9; contracts/api-analytics.md).

/** Filas de la vista previa en Reportes. */
export const REPORT_PREVIEW_SIZE = 10;

/** Máximo de filas que devuelve el CSV. */
export const CSV_MAX_ROWS = 5000;

export const NO_INCIDENTS_TO_EXPORT = 'No hay incidentes para exportar';

export const INCIDENTS_LOAD_FAILED = 'No se pudieron cargar los incidentes';

/** Motivo por el que no se puede exportar; null si se puede. */
export function exportBlockedReason(total: number | undefined, failed = false): string | null {
  if (total === undefined) return failed ? INCIDENTS_LOAD_FAILED : 'Cargando los incidentes…';
  if (total === 0) return NO_INCIDENTS_TO_EXPORT;
  return null;
}

/** Aviso si el total supera el máximo de filas del CSV. */
export function exportLimitNote(total: number): string | null {
  return total > CSV_MAX_ROWS
    ? `El CSV incluye como máximo ${CSV_MAX_ROWS.toLocaleString('es-CO')} filas; ajusta los filtros para exportar el resto.`
    : null;
}
