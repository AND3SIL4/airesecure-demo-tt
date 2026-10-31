import type { IncidentSort } from '../../../domain/incidentFilters';
import { exportLimitNote, REPORT_PREVIEW_SIZE } from '../../../domain/reports';
import type { Incident } from '../../../domain/types';
import { IncidentTable } from '../incidents/IncidentTable';

export interface ReportPreviewProps {
  incidents: readonly Incident[];
  total: number;
  sort: IncidentSort;
  onSortChange: (sort: IncidentSort) => void;
  onOpen: (id: string) => void;
}

/** Vista previa del reporte: las primeras filas (máximo 10) y el total que tendrá el CSV. */
export function ReportPreview({ incidents, total, sort, onSortChange, onOpen }: ReportPreviewProps) {
  const shown = Math.min(incidents.length, REPORT_PREVIEW_SIZE);
  const limitNote = exportLimitNote(total);

  return (
    <div className="space-y-3">
      <p role="status" className="tabular text-sm text-slate-700">
        Mostrando las primeras <strong className="font-semibold text-slate-900">{shown}</strong> de{' '}
        <strong className="font-semibold text-slate-900">{total.toLocaleString('es-CO')}</strong>{' '}
        {total === 1 ? 'incidente' : 'incidentes'} que incluirá el CSV.
      </p>
      <IncidentTable
        incidents={incidents.slice(0, REPORT_PREVIEW_SIZE)}
        sort={sort}
        onSortChange={onSortChange}
        onOpen={onOpen}
        caption={`Vista previa del reporte: ${shown} de ${total} incidentes.`}
      />
      {limitNote && <p className="text-xs text-sev-alta-text">{limitNote}</p>}
    </div>
  );
}
