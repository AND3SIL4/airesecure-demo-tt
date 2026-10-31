import { ArrowUpRight, CheckCheck, MessageSquare, Play, Users } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useTeams } from '../../../application/hooks/useCatalogs';
import { useIncidentAction } from '../../../application/hooks/useIncidentAction';
import { formatDateTime, formatDuration } from '../../../domain/format';
import { allowedIncidentActions, type IncidentActionAvailability } from '../../../domain/status';
import { teamOptionLabel } from '../../../domain/teams';
import { SYSTEM_ACTOR_LABEL, lastEventOf } from '../../../domain/timeline';
import type { IncidentActionBody, IncidentActionName, IncidentDetail } from '../../../domain/types';
import { Button } from '../../components/Button';
import { StatusBadge } from '../../components/StatusBadge';
import { Tooltip, type TooltipProps } from '../../components/Tooltip';
import { CommentDialog } from '../../components/CommentDialog';
import { AssignTeamDialog } from './AssignTeamDialog';
import { EscalateIncidentDialog } from './EscalateIncidentDialog';
import { ResolveIncidentDialog } from './ResolveIncidentDialog';

export interface IncidentActionsPanelProps {
  incident: IncidentDetail;
}

type OpenDialog = 'assign' | 'escalate' | 'resolve' | 'comment' | null;

const COMMENT_DESCRIPTION = 'El comentario queda en el historial del incidente con tu perfil y la hora.';
const TEAMS_LOADING_REASON = 'Cargando los equipos…';

/**
 * Botón que, si la acción no está disponible, sigue siendo enfocable (`aria-disabled`) para que
 * el tooltip explique el motivo con ratón y con teclado.
 */
function ActionButton({
  availability,
  children,
}: {
  availability: Pick<IncidentActionAvailability, 'enabled' | 'disabledReason'>;
  children: TooltipProps['children'];
}) {
  if (availability.enabled || !availability.disabledReason) return children;
  return (
    <Tooltip content={availability.disabledReason} side="top" wrapperClassName="flex w-full">
      {children}
    </Tooltip>
  );
}

/** Gestión del incidente según su estado (doc 09 §3.6). Escalar y resolver siempre pasan por un diálogo. */
export function IncidentActionsPanel({ incident }: IncidentActionsPanelProps) {
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const [selectedTeamId, setSelectedTeamId] = useState(incident.team?.id ?? '');
  const [syncedTeamId, setSyncedTeamId] = useState(incident.team?.id ?? '');
  const selectId = useId();
  const teams = useTeams();
  const action = useIncidentAction(incident.id);
  // Tras escalar o resolver, el foco pasa al bloque de estado resultante.
  const focusStatusPending = useRef(false);
  const statusRef = useRef<HTMLDivElement>(null);

  // Si el equipo cambia desde fuera (otra persona o un evento en vivo), el selector se sincroniza.
  const currentTeamId = incident.team?.id ?? '';
  if (currentTeamId !== syncedTeamId) {
    setSyncedTeamId(currentTeamId);
    setSelectedTeamId(currentTeamId);
  }

  const available = allowedIncidentActions(incident.status, incident.team !== null);
  const availability = (name: IncidentActionName) => available.find((a) => a.action === name);
  const busy = action.isPending;
  const pendingAction = busy ? action.variables?.action : undefined;

  const run = (body: IncidentActionBody) => {
    action.mutate(body, {
      onSuccess: () => {
        if (body.action === 'escalate' || body.action === 'resolve') focusStatusPending.current = true;
        setDialog(null);
      },
    });
  };

  // Se ejecuta tras cerrar el diálogo (el Dialog devuelve el foco al desmontarse) y al cambiar el estado.
  useEffect(() => {
    if (!focusStatusPending.current || dialog !== null) return;
    if (incident.status !== 'escalado' && incident.status !== 'resuelto') return;
    statusRef.current?.focus();
    focusStatusPending.current = false;
  }, [incident.status, dialog]);

  const assign = availability('assign');
  const start = availability('start');
  const escalate = availability('escalate');
  const resolve = availability('resolve');
  const comment = availability('comment');

  const resolveEvent = incident.status === 'resuelto' ? lastEventOf(incident.timeline, 'resolve') : null;
  const resolvedAt = resolveEvent?.createdAt ?? incident.resolvedAt;
  const teamList = teams.data ?? [];

  const blockedClass = 'cursor-not-allowed opacity-60';

  const sameTeamSelected = selectedTeamId === '' || selectedTeamId === currentTeamId;
  const assignBlockedReason = !teams.data
    ? TEAMS_LOADING_REASON
    : selectedTeamId === ''
      ? 'Selecciona un equipo para asignarlo'
      : sameTeamSelected
        ? 'Ese equipo ya está asignado'
        : null;
  const escalateBlockedReason = !teams.data ? TEAMS_LOADING_REASON : null;

  return (
    <div className="space-y-4">
      <div
        ref={statusRef}
        tabIndex={-1}
        aria-label="Estado del incidente"
        className="space-y-2 rounded-md border border-slate-200 bg-surface-muted p-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        <StatusBadge status={incident.status} />
        <dl className="space-y-1.5">
          <div>
            <dt className="text-xs font-medium text-slate-600 uppercase">Equipo actual</dt>
            <dd className="text-slate-900">{incident.team?.name ?? 'Sin equipo asignado'}</dd>
          </div>
          {incident.escalatedTo && (
            <div>
              <dt className="text-xs font-medium text-slate-600 uppercase">Escalado a</dt>
              <dd className="text-slate-900">
                {incident.escalatedTo.name}
                {incident.escalatedAt && (
                  <span className="text-slate-600"> · {formatDateTime(incident.escalatedAt)}</span>
                )}
              </dd>
            </div>
          )}
        </dl>
        {incident.status === 'resuelto' && (
          <div className="space-y-2 border-t border-slate-200 pt-2">
            <p className="text-slate-700">
              Resuelto por{' '}
              <span className="font-medium text-slate-900">{resolveEvent?.actor?.alias ?? SYSTEM_ACTOR_LABEL}</span>
              {resolvedAt && <> · {formatDateTime(resolvedAt)}</>}
              {incident.resolutionSeconds !== null && <> · {formatDuration(incident.resolutionSeconds)}</>}
            </p>
            {incident.resolutionNote && (
              <blockquote className="rounded-md border-l-2 border-ok/60 bg-surface px-3 py-2 whitespace-pre-line text-slate-800">
                {incident.resolutionNote}
              </blockquote>
            )}
          </div>
        )}
      </div>

      {assign && (
        <div className="space-y-1.5">
          <label htmlFor={selectId} className="text-sm font-medium text-slate-800">
            Asignar equipo
          </label>
          <div className="flex flex-col gap-2">
            <select
              id={selectId}
              value={selectedTeamId}
              disabled={busy || !teams.data}
              onChange={(event) => setSelectedTeamId(event.target.value)}
              className="h-10 w-full min-w-0 rounded-md border border-slate-300 bg-surface px-2 text-sm disabled:opacity-60"
            >
              <option value="">{teams.isPending ? 'Cargando equipos…' : 'Selecciona un equipo'}</option>
              {teamList.map((team) => (
                <option key={team.id} value={team.id}>
                  {teamOptionLabel(team)}
                </option>
              ))}
            </select>
            <ActionButton
              availability={{
                enabled: !assignBlockedReason,
                disabledReason: assignBlockedReason,
              }}
            >
              <Button
                variant="secondary"
                icon={Users}
                aria-disabled={assignBlockedReason ? true : undefined}
                onClick={() => {
                  if (!assignBlockedReason && !busy) setDialog('assign');
                }}
                loading={pendingAction === 'assign'}
                disabled={busy && pendingAction !== 'assign'}
                className={`w-full ${assignBlockedReason ? blockedClass : ''}`}
              >
                Asignar
              </Button>
            </ActionButton>
          </div>
          {teams.isError && (
            <p className="text-xs text-sev-critica-text">
              No se pudieron cargar los equipos.{' '}
              <button type="button" onClick={() => void teams.refetch()} className="font-medium underline">
                Reintentar
              </button>
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {start && (
          <ActionButton availability={start}>
            <Button
              icon={Play}
              aria-disabled={start.enabled ? undefined : true}
              onClick={() => {
                if (start.enabled && !busy) run({ action: 'start' });
              }}
              loading={pendingAction === 'start'}
              disabled={busy && pendingAction !== 'start'}
              className={`w-full ${start.enabled ? '' : blockedClass}`}
            >
              Atender
            </Button>
          </ActionButton>
        )}
        {escalate && (
          <ActionButton
            availability={{
              enabled: !escalateBlockedReason,
              disabledReason: escalateBlockedReason,
            }}
          >
            <Button
              variant="secondary"
              icon={ArrowUpRight}
              aria-disabled={escalateBlockedReason ? true : undefined}
              onClick={() => {
                if (!escalateBlockedReason && !busy) setDialog('escalate');
              }}
              loading={pendingAction === 'escalate'}
              disabled={busy && pendingAction !== 'escalate'}
              className={`w-full ${escalateBlockedReason ? blockedClass : ''}`}
            >
              Escalar
            </Button>
          </ActionButton>
        )}
        {resolve && (
          <Button
            variant="secondary"
            icon={CheckCheck}
            onClick={() => setDialog('resolve')}
            loading={pendingAction === 'resolve'}
            disabled={busy}
          >
            Resolver
          </Button>
        )}
        {comment && (
          <Button
            variant="ghost"
            icon={MessageSquare}
            onClick={() => setDialog('comment')}
            loading={pendingAction === 'comment'}
            disabled={busy}
            className="border-slate-200"
          >
            Comentar
          </Button>
        )}
      </div>
      <p className="text-xs text-slate-600">Cada decisión queda registrada en la historia con tu perfil y la hora.</p>

      {dialog === 'assign' && assign && teams.data && (
        <AssignTeamDialog
          incidentId={incident.id}
          teams={teams.data}
          currentTeamId={incident.team?.id ?? null}
          initialTeamId={selectedTeamId || null}
          loading={busy}
          onSubmit={(teamId, text) =>
            run(text ? { action: 'assign', teamId, comment: text } : { action: 'assign', teamId })
          }
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog === 'escalate' && escalate && teams.data && (
        <EscalateIncidentDialog
          incidentId={incident.id}
          teams={teams.data}
          loading={busy}
          onSubmit={(teamId, reason) => run({ action: 'escalate', teamId, reason })}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog === 'resolve' && resolve && (
        <ResolveIncidentDialog
          incidentId={incident.id}
          loading={busy}
          onConfirm={(note) => run({ action: 'resolve', note })}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog === 'comment' && (
        <CommentDialog
          targetId={incident.id}
          description={COMMENT_DESCRIPTION}
          loading={busy}
          onSubmit={(text) => run({ action: 'comment', comment: text })}
          onCancel={() => setDialog(null)}
        />
      )}
    </div>
  );
}
