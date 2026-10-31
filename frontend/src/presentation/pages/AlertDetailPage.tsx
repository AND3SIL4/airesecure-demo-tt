import { ArrowLeft, FlaskConical, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAlert } from '../../application/hooks/useAlert';
import { useAutoReview } from '../../application/hooks/useAutoReview';
import { useZones } from '../../application/hooks/useCatalogs';
import { registerActiveAlertView } from '../../application/stores/notifications';
import { formatDateTime } from '../../domain/format';
import type { AlertDetail } from '../../domain/types';
import { Card } from '../components/Card';
import { ConfidenceMeter } from '../components/ConfidenceMeter';
import { ErrorState } from '../components/ErrorState';
import { EvidenceViewer } from '../components/EvidenceViewer';
import { MiniMap2D } from '../components/MiniMap2D';
import { RelativeTime } from '../components/RelativeTime';
import { ScoreBreakdown } from '../components/ScoreBreakdown';
import { SeverityBadge } from '../components/SeverityBadge';
import { Skeleton } from '../components/Skeleton';
import { StatusBadge } from '../components/StatusBadge';
import { Timeline } from '../components/Timeline';
import { AlertActionsPanel } from '../features/alerts/AlertActionsPanel';

const BACK_LINK_CLASS =
  'inline-flex items-center gap-1.5 rounded text-sm font-medium text-brand-700 hover:text-brand-600 hover:underline';

function BackLink() {
  return (
    <Link to="/alertas" className={BACK_LINK_CLASS}>
      <ArrowLeft aria-hidden="true" className="size-4" />
      Volver a alertas
    </Link>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton rows={2} className="max-w-xl" label="Cargando la alerta…" />
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <div aria-hidden="true" className="aspect-video rounded-lg bg-slate-200 motion-safe:animate-pulse" />
          <Skeleton variant="card" label="Cargando el desglose…" />
          <Skeleton rows={4} label="Cargando el historial…" />
        </div>
        <div className="space-y-4 lg:col-span-4">
          <Skeleton variant="card" label="Cargando las acciones…" />
          <Skeleton variant="card" label="Cargando la ubicación…" />
        </div>
      </div>
    </div>
  );
}

/** Protocolo como checklist visual de apoyo: no se guarda. */
function ProtocolChecklist({ steps }: { steps: readonly string[] }) {
  const [done, setDone] = useState<ReadonlySet<number>>(() => new Set());
  if (steps.length === 0) return <p className="text-sm text-slate-600">Sin protocolo definido para este tipo.</p>;
  return (
    <div>
      <ol className="space-y-1.5">
        {steps.map((step, index) => (
          <li key={step}>
            <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                checked={done.has(index)}
                onChange={() =>
                  setDone((prev) => {
                    const next = new Set(prev);
                    if (next.has(index)) next.delete(index);
                    else next.add(index);
                    return next;
                  })
                }
                className="mt-0.5 size-4 accent-brand-600"
              />
              <span className={done.has(index) ? 'text-slate-500 line-through' : ''}>
                {index + 1}. {step}
              </span>
            </label>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-xs text-slate-600">Lista de apoyo: las marcas no se guardan.</p>
    </div>
  );
}

function AlertDetailContent({ alert }: { alert: AlertDetail }) {
  const zones = useZones();
  const isManual = alert.origin === 'manual' || alert.scoreBreakdown.manual;

  return (
    <article aria-labelledby="alert-title" className="space-y-4">
      <BackLink />

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={alert.severity} />
          <StatusBadge status={alert.status} />
          <span className="inline-flex h-7 items-center gap-1.5 rounded-md border border-demo-fg/30 bg-demo-bg px-2.5 text-sm font-medium text-demo-fg">
            <FlaskConical aria-hidden="true" className="size-4" />
            {isManual ? 'Reporte humano · demostrativo' : 'Predicción demostrativa'}
          </span>
        </div>
        <h1 id="alert-title" className="text-2xl font-semibold text-slate-900">
          <span className="tabular">{alert.id}</span> · {alert.type.name}
        </h1>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
          <span className="font-medium text-slate-800">{alert.zone.name}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={alert.detectedAt} className="tabular">
            {formatDateTime(alert.detectedAt)}
          </time>
          <span aria-hidden="true">·</span>
          <RelativeTime value={alert.detectedAt} focusable />
          {alert.reportedBy && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <UserRound aria-hidden="true" className="size-4" />
                Reportada por {alert.reportedBy.alias}
              </span>
            </>
          )}
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* En tablet (1 columna) las acciones van primero, y ubicación y confianza lado a lado para no empujar la evidencia. */}
        <aside aria-label="Acciones y contexto" className="order-first grid content-start gap-4 md:grid-cols-2 lg:order-last lg:col-span-4 lg:grid-cols-1">
          <Card title="Acciones" className="md:col-span-2 lg:col-span-1">
            <AlertActionsPanel alert={alert} />
          </Card>
          <Card title="Ubicación">
            {zones.isPending && <Skeleton rows={3} label="Cargando el plano…" />}
            {zones.isError && (
              <ErrorState
                title="No se pudo cargar el plano"
                message={zones.error.message}
                onRetry={() => void zones.refetch()}
                retrying={zones.isFetching}
                className="py-6"
              />
            )}
            {zones.data && <MiniMap2D zones={zones.data} highlightZoneId={alert.zone.id} />}
          </Card>
          <Card title="Confianza">
            <ConfidenceMeter value={alert.confidence} />
            <p className="mt-2 text-xs text-slate-600">
              {alert.confidence === null
                ? 'Evento reportado por una persona: no hay confianza del modelo.'
                : 'Estimación del modelo demostrativo; no es un hecho confirmado.'}
            </p>
          </Card>
        </aside>

        <div className="min-w-0 space-y-4 lg:col-span-8">
          <EvidenceViewer
            evidenceUrl={alert.evidenceUrl}
            typeCode={alert.type.code}
            sourceLabel={alert.source.label}
            detectedAt={alert.detectedAt}
          />
          <Card title="Descripción">
            <p className="text-sm whitespace-pre-line text-slate-800">{alert.description}</p>
          </Card>
          <Card title="Por qué se priorizó">
            <ScoreBreakdown breakdown={alert.scoreBreakdown} severity={alert.severity} />
          </Card>
          <Card title="Recomendación y protocolo">
            <p className="mb-4 text-sm text-slate-800">{alert.recommendation}</p>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Protocolo</h3>
            <ProtocolChecklist steps={alert.protocol} />
          </Card>
          <Card title="Historial">
            <Timeline events={alert.timeline} />
          </Card>
        </div>
      </div>
    </article>
  );
}

/** Detalle de alerta (doc 09 §3.4). Al abrir una alerta `nueva` se envía `review` una sola vez. */
export function AlertDetailPage() {
  const { id = '' } = useParams();
  const alert = useAlert(id);
  useAutoReview(alert.data);

  // Registra la vista activa para el aviso "La alerta X fue … por otro usuario" (tiempo real).
  useEffect(() => (id ? registerActiveAlertView(id) : undefined), [id]);

  if (alert.isPending) return <DetailSkeleton />;

  if (!alert.data) {
    return (
      <div className="space-y-4">
        <BackLink />
        {alert.isNotFound ? (
          <ErrorState
            title="Alerta no encontrada"
            message={`La alerta ${id} no existe.`}
            extraActions={
              <Link
                to="/alertas"
                className="inline-flex h-10 items-center rounded-md bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
              >
                Ir a la lista de alertas
              </Link>
            }
          />
        ) : (
          <ErrorState
            title="No se pudo cargar la alerta"
            message={alert.error?.message ?? 'Ocurrió un error inesperado.'}
            onRetry={() => void alert.refetch()}
            retrying={alert.isFetching}
          />
        )}
      </div>
    );
  }

  return <AlertDetailContent key={alert.data.id} alert={alert.data} />;
}
