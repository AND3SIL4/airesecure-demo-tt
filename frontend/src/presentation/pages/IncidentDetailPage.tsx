import { ArrowLeft, ExternalLink, UserRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useIncident } from '../../application/hooks/useIncident';
import { formatDateTime, formatDuration } from '../../domain/format';
import type { IncidentDetail } from '../../domain/types';
import { Card } from '../components/Card';
import { ConfidenceMeter } from '../components/ConfidenceMeter';
import { ErrorState } from '../components/ErrorState';
import { RelativeTime } from '../components/RelativeTime';
import { SeverityBadge } from '../components/SeverityBadge';
import { Skeleton } from '../components/Skeleton';
import { StatusBadge } from '../components/StatusBadge';
import { Timeline } from '../components/Timeline';
import { IncidentActionsPanel } from '../features/incidents/IncidentActionsPanel';

const BACK_LINK_CLASS =
  'inline-flex items-center gap-1.5 rounded text-sm font-medium text-brand-700 hover:text-brand-600 hover:underline';

function BackLink() {
  return (
    <Link to="/incidentes" className={BACK_LINK_CLASS}>
      <ArrowLeft aria-hidden="true" className="size-4" />
      Volver a incidentes
    </Link>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton rows={2} className="max-w-xl" label="Cargando el incidente…" />
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <Skeleton variant="card" label="Cargando la alerta de origen…" />
          <Skeleton rows={5} label="Cargando el historial…" />
        </div>
        <div className="space-y-4 lg:col-span-4">
          <Skeleton variant="card" label="Cargando la gestión…" />
        </div>
      </div>
    </div>
  );
}

function durationText(seconds: number | null): string {
  return seconds === null ? '—' : formatDuration(seconds);
}

function IncidentDetailContent({ incident }: { incident: IncidentDetail }) {
  const { alert } = incident;
  return (
    <article aria-labelledby="incident-title" className="space-y-4">
      <BackLink />

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={incident.status} />
          <SeverityBadge severity={alert.severity} />
        </div>
        <h1 id="incident-title" className="text-2xl font-semibold text-slate-900">
          <span className="tabular">{incident.id}</span> · {alert.type.name}
        </h1>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
          <span className="font-medium text-slate-800">{alert.zone.name}</span>
          <span aria-hidden="true">·</span>
          <span>
            Abierto <time dateTime={incident.openedAt} className="tabular">{formatDateTime(incident.openedAt)}</time>
          </span>
          <span aria-hidden="true">·</span>
          <RelativeTime value={incident.openedAt} focusable />
          {incident.openedBy && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <UserRound aria-hidden="true" className="size-4" />
                Confirmado por {incident.openedBy.alias}
              </span>
            </>
          )}
        </p>
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <div className="flex gap-1.5">
            <dt className="text-slate-600">Equipo:</dt>
            <dd className="font-medium text-slate-900">{incident.team?.name ?? 'Sin equipo'}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-slate-600">T. respuesta:</dt>
            <dd className="tabular font-medium text-slate-900">{durationText(incident.responseSeconds)}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-slate-600">T. resolución:</dt>
            <dd className="tabular font-medium text-slate-900">{durationText(incident.resolutionSeconds)}</dd>
          </div>
        </dl>
      </header>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* En tablet (1 columna) la gestión va primero para que esté siempre a la vista. */}
        <aside aria-label="Gestión del incidente" className="order-first space-y-4 lg:order-last lg:col-span-4">
          <Card title="Gestión">
            <IncidentActionsPanel incident={incident} />
          </Card>
        </aside>

        <div className="min-w-0 space-y-4 lg:col-span-8">
          <Card
            title="Alerta de origen"
            actions={
              <Link
                to={`/alertas/${encodeURIComponent(alert.id)}`}
                className="inline-flex items-center gap-1 rounded text-sm font-medium text-brand-700 underline underline-offset-2 hover:text-brand-600"
              >
                Ver alerta
                <span className="sr-only"> {alert.id}</span>
                <ExternalLink aria-hidden="true" className="size-3.5" />
              </Link>
            }
          >
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-slate-600 uppercase">ID</dt>
                <dd className="tabular font-medium text-slate-900">{alert.id}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-600 uppercase">Tipo</dt>
                <dd className="text-slate-900">{alert.type.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-600 uppercase">Severidad</dt>
                <dd>
                  <SeverityBadge severity={alert.severity} size="sm" />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-600 uppercase">Zona</dt>
                <dd className="text-slate-900">{alert.zone.name}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-slate-600 uppercase">Descripción</dt>
                <dd className="whitespace-pre-line text-slate-800">{alert.description}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-slate-600 uppercase">Confianza</dt>
                <dd>
                  <ConfidenceMeter value={alert.confidence} />
                </dd>
              </div>
            </dl>
          </Card>
          <Card title="Historial">
            <p className="mb-3 text-xs text-slate-600">Eventos de la alerta y del incidente en orden cronológico.</p>
            <Timeline events={incident.timeline} />
          </Card>
        </div>
      </div>
    </article>
  );
}

/** Detalle de incidente (doc 09 §3.6): encabezado, alerta de origen, historial combinado y gestión. */
export function IncidentDetailPage() {
  const { id = '' } = useParams();
  const incident = useIncident(id);

  if (incident.isPending) return <DetailSkeleton />;

  if (!incident.data) {
    return (
      <div className="space-y-4">
        <BackLink />
        {incident.isNotFound ? (
          <ErrorState
            title="Incidente no encontrado"
            message={incident.error?.message ?? `El incidente ${id} no existe.`}
            extraActions={
              <Link
                to="/incidentes"
                className="inline-flex h-10 items-center rounded-md bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
              >
                Ir al registro de incidentes
              </Link>
            }
          />
        ) : (
          <ErrorState
            title="No se pudo cargar el incidente"
            message={incident.error?.message ?? 'Ocurrió un error inesperado.'}
            onRetry={() => void incident.refetch()}
            retrying={incident.isFetching}
          />
        )}
      </div>
    );
  }

  return <IncidentDetailContent key={incident.data.id} incident={incident.data} />;
}
