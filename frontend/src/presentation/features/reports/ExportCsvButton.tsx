import { Download } from 'lucide-react';
import { useDownloadIncidentsCsv } from '../../../application/hooks/useDownloadIncidentsCsv';
import type { IncidentFilters } from '../../../domain/incidentFilters';
import { exportBlockedReason } from '../../../domain/reports';
import { Button, type ButtonVariant } from '../../components/Button';
import { Tooltip } from '../../components/Tooltip';

export interface ExportCsvButtonProps {
  filters: IncidentFilters;
  /** Total con estos filtros (undefined mientras carga). */
  total: number | undefined;
  /** La consulta del total falló (el motivo cambia de "Cargando…" a "No se pudieron cargar…"). */
  failed?: boolean;
  label: string;
  variant?: ButtonVariant;
}

/**
 * Descarga el CSV de incidentes con los filtros dados (solo se muestra al supervisor).
 * Si no se puede exportar, sigue siendo enfocable (`aria-disabled`) y el tooltip explica el motivo.
 */
export function ExportCsvButton({ filters, total, failed = false, label, variant = 'primary' }: ExportCsvButtonProps) {
  const download = useDownloadIncidentsCsv();
  const blockedReason = exportBlockedReason(total, failed);

  const button = (
    <Button
      variant={variant}
      icon={Download}
      loading={download.isPending}
      aria-disabled={blockedReason ? true : undefined}
      onClick={() => {
        if (!blockedReason && !download.isPending) download.mutate(filters);
      }}
      className={blockedReason ? 'cursor-not-allowed opacity-60' : ''}
    >
      {download.isPending ? 'Descargando…' : label}
    </Button>
  );

  if (!blockedReason) return button;
  return (
    <Tooltip content={blockedReason} side="bottom-end">
      {button}
    </Tooltip>
  );
}
