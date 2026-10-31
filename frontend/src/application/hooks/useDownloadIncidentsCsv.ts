import { useMutation } from '@tanstack/react-query';
import type { IncidentFilters } from '../../domain/incidentFilters';
import { downloadIncidentsCsv } from '../../infrastructure/api/reports';
import { errorToastMessage } from '../errorMessage';
import { toast } from '../stores/toasts';

/** Descarga del CSV de incidentes (solo supervisor) con los filtros dados; avisa el resultado con un toast. */
export function useDownloadIncidentsCsv() {
  return useMutation({
    mutationFn: (filters: IncidentFilters) => downloadIncidentsCsv(filters),
    onSuccess: (filename) => {
      toast.success(`Reporte ${filename} descargado.`);
    },
    onError: (error) => {
      toast.error(errorToastMessage(error));
    },
  });
}
