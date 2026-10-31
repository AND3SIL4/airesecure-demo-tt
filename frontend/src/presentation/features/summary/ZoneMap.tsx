import { useNavigate } from 'react-router-dom';
import { useZones } from '../../../application/hooks/useCatalogs';
import { mergeZoneStatus } from '../../../domain/dashboard';
import type { AlertMarker, ZoneStatus } from '../../../domain/types';
import { Card } from '../../components/Card';
import { ErrorState } from '../../components/ErrorState';
import { MiniMap2D } from '../../components/MiniMap2D';

export interface ZoneMapProps {
  zones: readonly ZoneStatus[];
  markers: readonly AlertMarker[];
  className?: string;
}

/** Mini-mapa del Resumen: zonas por riesgo, marcadores por severidad y clic a la lista filtrada por zona (HU-07). */
export function ZoneMap({ zones, markers, className = '' }: ZoneMapProps) {
  const navigate = useNavigate();
  const catalog = useZones();

  return (
    <Card title="Mapa de la terminal" className={className}>
      {catalog.isPending ? (
        <div role="status" aria-busy="true" className="aspect-[3/2] w-full rounded-md bg-slate-200 motion-safe:animate-pulse">
          <span className="sr-only">Cargando el mapa…</span>
        </div>
      ) : catalog.isError ? (
        <ErrorState
          message="No se pudo cargar el plano de la terminal."
          onRetry={() => void catalog.refetch()}
          retrying={catalog.isFetching}
        />
      ) : (
        <>
          <MiniMap2D
            zones={mergeZoneStatus(catalog.data, zones)}
            markers={markers}
            onZoneClick={(zone) =>
              void navigate(`/alertas?status=activas&zone=${encodeURIComponent(zone.id)}`)
            }
          />
          <p className="mt-2 text-xs text-slate-600">Selecciona una zona para ver sus alertas activas.</p>
        </>
      )}
    </Card>
  );
}
