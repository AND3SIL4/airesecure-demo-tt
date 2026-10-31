import { CircleAlert, MonitorOff, PanelRight, RefreshCw } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAlerts } from '../../application/hooks/useAlerts';
import { useZones } from '../../application/hooks/useCatalogs';
import { DEFAULT_ALERT_FILTERS, type AlertFilters } from '../../domain/alertFilters';
import { alertCountLabel, toMapMarkers, type CameraPreset } from '../../domain/map3d';
import type { AlertSummary, Zone } from '../../domain/types';
import { isWebGLAvailable } from '../map3d/webgl';
import { Button } from '../components/Button';
import { Dialog } from '../components/Dialog';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { MiniMap2D } from '../components/MiniMap2D';
import { Skeleton } from '../components/Skeleton';
import { CameraControls } from '../features/map/CameraControls';
import { MapLegend } from '../features/map/MapLegend';
import { ZonePanel, type ZonePanelAlertsState } from '../features/map/ZonePanel';
import { TerminalMap3D, type CameraRequest } from '../map3d/TerminalMap3D';

/** Todas las alertas activas (nueva + en revisión) para los marcadores: máximo de la API. */
const ACTIVE_ALERTS: AlertFilters = { ...DEFAULT_ALERT_FILTERS, sort: 'severity:desc' };
const MAP_ALERTS_PAGE_SIZE = 100;
const NO_ZONES: readonly Zone[] = [];
const NO_ALERTS: readonly AlertSummary[] = [];

const SCENE_HEIGHT = 'h-[min(70vh,720px)] min-h-[420px]';
const BLOCK = 'rounded-lg bg-slate-200 motion-safe:animate-pulse';

function MapSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <Skeleton rows={1} className="sr-only" label="Cargando el mapa…" />
      <div aria-hidden="true" className={`${BLOCK} ${SCENE_HEIGHT} lg:col-span-9`} />
      <div aria-hidden="true" className={`${BLOCK} hidden h-[420px] lg:col-span-3 lg:block`} />
    </div>
  );
}

/** Mapa 3D de la Terminal 1 (doc 09 §3.7, HU-08): escena por riesgo, marcadores y panel de zonas. */
export function MapPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const zonesQuery = useZones();
  const alertsQuery = useAlerts(ACTIVE_ALERTS, MAP_ALERTS_PAGE_SIZE);
  const [webgl, setWebgl] = useState(isWebGLAvailable);
  const [cameraRequest, setCameraRequest] = useState<CameraRequest | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const zones = zonesQuery.data ?? NO_ZONES;
  const alerts = alertsQuery.data?.items ?? NO_ALERTS;
  const totalActive = alertsQuery.data?.total ?? 0;
  const markers = useMemo(() => toMapMarkers(alerts), [alerts]);

  const requestedZone = params.get('zone');
  const selectedZone = zones.find((z) => z.id === requestedZone) ?? null;
  const selectedZoneId = selectedZone?.id ?? null;

  const selectZone = useCallback(
    (zoneId: string) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('zone', zoneId);
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const clearSelection = useCallback(() => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('zone');
        return next;
      },
      { replace: true },
    );
  }, [setParams]);

  const openAlert = useCallback(
    (alertId: string) => {
      void navigate(`/alertas/${encodeURIComponent(alertId)}`);
    },
    [navigate],
  );

  const handleUnavailable = useCallback(() => setWebgl(false), []);

  const requestPreset = useCallback((preset: CameraPreset) => {
    setCameraRequest((prev) => ({ preset, seq: (prev?.seq ?? 0) + 1 }));
  }, []);

  const alertsState: ZonePanelAlertsState = alertsQuery.isPending
    ? 'pending'
    : alertsQuery.isError && !alertsQuery.data
      ? 'error'
      : 'ready';
  const retryAlerts = () => void alertsQuery.refetch();

  const zonesWithAlerts = zones.filter((z) => z.activeAlerts > 0).length;
  const sceneLabel = [
    `Maqueta 3D de la Terminal 1 con ${zones.length} zonas coloreadas por riesgo`,
    `y ${markers.length} marcadores de alertas activas.`,
    selectedZone ? `Zona seleccionada: ${selectedZone.name}.` : '',
    'La lista de zonas del panel es la alternativa accesible.',
  ]
    .filter(Boolean)
    .join(' ');

  const panel = (
    <ZonePanel
      zones={zones}
      alerts={alerts}
      alertsState={alertsState}
      onRetryAlerts={retryAlerts}
      retryingAlerts={alertsQuery.isFetching}
      selectedZoneId={selectedZoneId}
      onSelectZone={selectZone}
      onClearSelection={clearSelection}
    />
  );

  let content;
  if (zonesQuery.isPending) {
    content = <MapSkeleton />;
  } else if (zonesQuery.isError) {
    content = (
      <ErrorState
        title="No se pudo cargar el mapa"
        message={zonesQuery.error.message || 'Inténtalo de nuevo en unos segundos.'}
        onRetry={() => {
          void zonesQuery.refetch();
          void alertsQuery.refetch();
        }}
        retrying={zonesQuery.isFetching}
      />
    );
  } else if (zones.length === 0) {
    content = (
      <EmptyState title="Sin zonas configuradas" message="La terminal no tiene zonas para mostrar en el mapa." />
    );
  } else {
    content = (
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-3 rounded-lg border border-slate-200 bg-surface p-3 shadow-sm lg:col-span-9">
          {alertsQuery.isError && (
            <div
              role="alert"
              className="flex flex-wrap items-center gap-2 rounded-md bg-sev-alta/10 px-3 py-2 text-sm text-sev-alta-text"
            >
              <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
              <span className="flex-1">No se pudieron cargar las alertas activas; los marcadores pueden no estar al día.</span>
              <Button variant="ghost" size="sm" icon={RefreshCw} loading={alertsQuery.isFetching} onClick={retryAlerts}>
                Reintentar
              </Button>
            </div>
          )}
          {totalActive > alerts.length && (
            <p className="text-xs text-slate-600">
              Se muestran {alerts.length} de {totalActive} alertas activas (las de mayor severidad).
            </p>
          )}

          {webgl ? (
            <>
              <div className={`relative rounded-md bg-gradient-to-b from-surface-muted to-slate-200 ${SCENE_HEIGHT}`}>
                <TerminalMap3D
                  zones={zones}
                  markers={markers}
                  selectedZoneId={selectedZoneId}
                  onSelectZone={selectZone}
                  onOpenAlert={openAlert}
                  cameraRequest={cameraRequest}
                  onUnavailable={handleUnavailable}
                  ariaLabel={sceneLabel}
                  className="rounded-md"
                />
                <CameraControls onPreset={requestPreset} className="absolute top-3 left-3 z-10" />
              </div>
              <p className="text-xs text-slate-600">
                Arrastra para orbitar y usa la rueda para acercar. Haz clic en una zona para ver sus alertas o en un
                marcador para abrir la alerta.
              </p>
              <MapLegend />
            </>
          ) : (
            <>
              <p
                role="status"
                className="flex items-center gap-2 rounded-md bg-demo-bg px-3 py-2 text-sm font-medium text-demo-fg"
              >
                <MonitorOff aria-hidden="true" className="size-4 shrink-0" />
                Vista 2D (WebGL no disponible)
              </p>
              <MiniMap2D
                zones={zones}
                markers={markers}
                highlightZoneId={selectedZoneId ?? undefined}
                onZoneClick={(zone) => selectZone(zone.id)}
              />
            </>
          )}
        </div>

        <aside
          aria-label="Panel de zonas"
          className="hidden rounded-lg border border-slate-200 bg-surface p-4 shadow-sm lg:col-span-3 lg:block lg:max-h-[min(85vh,860px)] lg:overflow-y-auto"
        >
          {panel}
        </aside>
      </div>
    );
  }

  const zonesReady = zonesQuery.isSuccess && zones.length > 0;

  return (
    <section aria-labelledby="map-title" className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 id="map-title" className="text-2xl font-semibold text-slate-900">
            Mapa
          </h1>
          <p className="text-sm text-slate-600">
            Terminal 1 con las zonas coloreadas por riesgo y las alertas activas. La decisión siempre es humana.
          </p>
          {zonesReady && alertsState === 'ready' && (
            <p className="tabular text-sm text-slate-600">
              {totalActive === 0
                ? 'Sin alertas activas en la terminal.'
                : `${alertCountLabel(totalActive)} activas en ${zonesWithAlerts} de ${zones.length} zonas.`}
            </p>
          )}
        </div>
        {zonesReady && (
          <Button variant="secondary" icon={PanelRight} onClick={() => setDrawerOpen(true)} className="lg:hidden">
            Zonas
          </Button>
        )}
      </header>

      {content}

      {zonesReady && (
        <Dialog
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Zonas"
          className="my-0! mr-0! ml-auto! h-dvh! max-h-none! w-[min(24rem,100vw)]! rounded-none! rounded-l-xl!"
        >
          {panel}
        </Dialog>
      )}
    </section>
  );
}
