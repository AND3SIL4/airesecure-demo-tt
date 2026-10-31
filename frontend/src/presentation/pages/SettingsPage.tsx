import { FlaskConical } from 'lucide-react';
import { useMemo } from 'react';
import { useAlertTypes, useZones } from '../../application/hooks/useCatalogs';
import { useResetDemo } from '../../application/hooks/useResetDemo';
import { useScenarios } from '../../application/hooks/useScenarios';
import { useSettings } from '../../application/hooks/useSettings';
import { useTriggerScenario } from '../../application/hooks/useTriggerScenario';
import { useUpdateSettings } from '../../application/hooks/useUpdateSettings';
import type { SettingsUpdate } from '../../domain/types';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Skeleton } from '../components/Skeleton';
import { DangerZone } from '../features/settings/DangerZone';
import { ScenarioCards } from '../features/settings/ScenarioCards';
import { SimulatorCard } from '../features/settings/SimulatorCard';
import { ThresholdsTable } from '../features/settings/ThresholdsTable';

function toNameMap(entries: [string, string][] | undefined): Record<string, string> {
  return Object.fromEntries(entries ?? []);
}

/** Configuración (doc 09 §3.10, solo supervisor): simulador, escenarios, umbrales y reinicio de la demo. */
export function SettingsPage() {
  const settings = useSettings();
  const scenarios = useScenarios();
  const alertTypes = useAlertTypes();
  const zones = useZones();
  const updateSettings = useUpdateSettings();
  const triggerScenario = useTriggerScenario();
  const resetDemo = useResetDemo();

  const typeNames = useMemo(() => toNameMap(alertTypes.data?.map((t) => [t.code, t.name])), [alertTypes.data]);
  const zoneNames = useMemo(() => toNameMap(zones.data?.map((z) => [z.id, z.name])), [zones.data]);

  const save = (update: SettingsUpdate, onDone?: () => void) => {
    updateSettings.mutate(update, { onSuccess: () => onDone?.() });
  };
  const savingSimulator = updateSettings.isPending && updateSettings.variables?.simulator !== undefined;
  const savingThresholds = updateSettings.isPending && updateSettings.variables?.thresholds !== undefined;

  const settingsError = settings.isError && !settings.data;

  let simulatorContent;
  let thresholdsContent;
  if (settings.isPending) {
    simulatorContent = <Skeleton variant="card" label="Cargando el simulador…" />;
    thresholdsContent = <Skeleton variant="table" rows={6} label="Cargando los umbrales…" />;
  } else if (settingsError) {
    simulatorContent = (
      <ErrorState
        title="No se pudo cargar la configuración"
        message={settings.error.message}
        onRetry={() => void settings.refetch()}
        retrying={settings.isFetching}
      />
    );
    thresholdsContent = null;
  } else {
    simulatorContent = (
      <SimulatorCard simulator={settings.data.simulator} saving={savingSimulator} onSave={save} />
    );
    thresholdsContent =
      Object.keys(settings.data.thresholds).length === 0 ? (
        <EmptyState title="Sin umbrales configurables" message="Ningún tipo de alerta tiene umbral de confianza." />
      ) : (
        <ThresholdsTable
          thresholds={settings.data.thresholds}
          typeNames={typeNames}
          belowThreshold={settings.data.belowThreshold}
          saving={savingThresholds}
          onSave={save}
        />
      );
  }

  let scenariosContent;
  if (scenarios.isPending) {
    scenariosContent = (
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} variant="card" label="Cargando los escenarios…" />
        ))}
      </div>
    );
  } else if (scenarios.isError && !scenarios.data) {
    scenariosContent = (
      <ErrorState
        title="No se pudieron cargar los escenarios"
        message={scenarios.error.message}
        onRetry={() => void scenarios.refetch()}
        retrying={scenarios.isFetching}
      />
    );
  } else if (scenarios.data.length === 0) {
    scenariosContent = (
      <EmptyState icon={FlaskConical} title="Sin escenarios" message="No hay escenarios predefinidos disponibles." />
    );
  } else {
    scenariosContent = (
      <ScenarioCards
        scenarios={scenarios.data}
        typeNames={typeNames}
        zoneNames={zoneNames}
        pendingId={triggerScenario.isPending ? (triggerScenario.variables ?? null) : null}
        onTrigger={(id) => triggerScenario.mutate(id)}
      />
    );
  }

  return (
    <section aria-labelledby="settings-title" className="space-y-4">
      <header>
        <h1 id="settings-title" className="text-2xl font-semibold text-slate-900">
          Configuración
        </h1>
        <p className="text-sm text-slate-600">
          Controla la demo: simulador, escenarios del guion, umbrales de confianza y reinicio de los datos.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {settings.isPending || settingsError ? <Card title="Simulador">{simulatorContent}</Card> : simulatorContent}

        <Card title="Escenarios">
          <p className="mb-3 text-xs text-slate-600">
            Cada escenario crea una alerta demostrativa en vivo, basada en reglas. Las demás pestañas reciben el aviso.
          </p>
          {scenariosContent}
        </Card>
      </div>

      {thresholdsContent && <Card title="Umbrales de confianza">{thresholdsContent}</Card>}

      <DangerZone resetting={resetDemo.isPending} onReset={({ onError }) => resetDemo.mutate(undefined, { onError })} />
    </section>
  );
}
