import { CircleCheck, CircleX, FolderOpen, MessageSquare } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAlertAction } from '../../../application/hooks/useAlertAction';
import { formatDateTime } from '../../../domain/format';
import { allowedAlertActions } from '../../../domain/status';
import { SYSTEM_ACTOR_LABEL, lastEventOf } from '../../../domain/timeline';
import type { AlertActionBody, AlertDetail } from '../../../domain/types';
import { Button } from '../../components/Button';
import { RelativeTime } from '../../components/RelativeTime';
import { CommentDialog } from '../../components/CommentDialog';
import { ConfirmAlertDialog } from './ConfirmAlertDialog';
import { DismissAlertDialog } from './DismissAlertDialog';

export interface AlertActionsPanelProps {
  alert: AlertDetail;
}

type OpenDialog = 'confirm' | 'dismiss' | 'comment' | null;

/** Acciones humanas según el estado (la IA no decide: confirmar o descartar siempre pasa por un diálogo). */
export function AlertActionsPanel({ alert }: AlertActionsPanelProps) {
  const [dialog, setDialog] = useState<OpenDialog>(null);
  // Tras confirmar o descartar, el botón disparador se desmonta: el foco pasa al bloque de estado resultante.
  const focusResultPending = useRef(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const action = useAlertAction(alert.id);
  const allowed = allowedAlertActions(alert.status);
  const busy = action.isPending;
  const pendingAction = busy ? action.variables?.action : undefined;

  const run = (body: AlertActionBody) => {
    action.mutate(body, {
      onSuccess: () => {
        if (body.action === 'confirm' || body.action === 'dismiss') focusResultPending.current = true;
        setDialog(null);
      },
    });
  };

  // Se ejecuta tras cerrar el diálogo y al cambiar el estado: enfoca el bloque resultante en cuanto existe.
  useEffect(() => {
    if (!focusResultPending.current) return;
    if (alert.status !== 'confirmada' && alert.status !== 'descartada') return;
    if (!resultRef.current) return;
    resultRef.current.focus();
    focusResultPending.current = false;
  }, [alert.status, dialog]);

  const dismissEvent = alert.status === 'descartada' ? lastEventOf(alert.timeline, 'dismiss') : null;
  const confirmEvent = alert.status === 'confirmada' ? lastEventOf(alert.timeline, 'confirm') : null;

  return (
    <div className="space-y-3">
      {alert.status === 'en_revision' && alert.reviewedBy && (
        <p className="text-sm text-slate-600">
          En revisión por <span className="font-medium text-slate-900">{alert.reviewedBy.alias}</span>
        </p>
      )}

      {alert.status === 'confirmada' && (
        <div
          ref={resultRef}
          tabIndex={-1}
          className="space-y-2 rounded-md border border-slate-200 bg-surface-muted p-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          <p className="text-slate-700">
            Confirmada por{' '}
            <span className="font-medium text-slate-900">{confirmEvent?.actor?.alias ?? SYSTEM_ACTOR_LABEL}</span>
            {confirmEvent && (
              <>
                {' · '}
                <RelativeTime value={confirmEvent.createdAt} focusable />
              </>
            )}
          </p>
          {alert.incidentId && (
            <Link
              to={`/incidentes/${alert.incidentId}`}
              className="inline-flex items-center gap-1.5 font-medium text-brand-700 underline underline-offset-2 hover:text-brand-600"
            >
              <FolderOpen aria-hidden="true" className="size-4" />
              Ver incidente {alert.incidentId}
            </Link>
          )}
        </div>
      )}

      {alert.status === 'descartada' && (
        <div
          ref={resultRef}
          tabIndex={-1}
          className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          <dl className="space-y-2 rounded-md border border-slate-200 bg-surface-muted p-3 text-sm">
            <div>
              <dt className="text-xs font-medium text-slate-600 uppercase">Motivo</dt>
              <dd className="text-slate-900">{alert.dismissReasonLabel ?? alert.dismissReason ?? 'Sin motivo registrado'}</dd>
            </div>
            {alert.dismissComment && (
              <div>
                <dt className="text-xs font-medium text-slate-600 uppercase">Comentario</dt>
                <dd className="whitespace-pre-line text-slate-800">{alert.dismissComment}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-medium text-slate-600 uppercase">Descartada por</dt>
              <dd className="text-slate-900">
                {dismissEvent?.actor?.alias ?? SYSTEM_ACTOR_LABEL}
                {(dismissEvent?.createdAt ?? alert.closedAt) && (
                  <span className="text-slate-600"> · {formatDateTime(dismissEvent?.createdAt ?? alert.closedAt ?? '')}</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {allowed.includes('confirm') && (
          <Button
            icon={CircleCheck}
            onClick={() => setDialog('confirm')}
            loading={pendingAction === 'confirm'}
            disabled={busy}
          >
            Confirmar incidente
          </Button>
        )}
        {allowed.includes('dismiss') && (
          <Button
            variant="secondary"
            icon={CircleX}
            onClick={() => setDialog('dismiss')}
            loading={pendingAction === 'dismiss'}
            disabled={busy}
          >
            Marcar como falso positivo
          </Button>
        )}
        {allowed.includes('comment') && (
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
      <p className="text-xs text-slate-600">La IA prioriza; la decisión es humana y queda registrada con tu perfil.</p>

      {dialog === 'confirm' && allowed.includes('confirm') && (
        <ConfirmAlertDialog
          alertId={alert.id}
          loading={busy}
          onConfirm={(note) => run(note ? { action: 'confirm', note } : { action: 'confirm' })}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog === 'dismiss' && allowed.includes('dismiss') && (
        <DismissAlertDialog
          alertId={alert.id}
          loading={busy}
          onSubmit={(reason, comment) =>
            run(comment ? { action: 'dismiss', reason, comment } : { action: 'dismiss', reason })
          }
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog === 'comment' && (
        <CommentDialog
          targetId={alert.id}
          loading={busy}
          onSubmit={(comment) => run({ action: 'comment', comment })}
          onCancel={() => setDialog(null)}
        />
      )}
    </div>
  );
}
