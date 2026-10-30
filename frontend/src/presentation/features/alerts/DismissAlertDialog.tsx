import { useId, useState, type FormEvent } from 'react';
import { useDismissReasons } from '../../../application/hooks/useCatalogs';
import { TEXT_LIMITS, type DismissReason, type DismissReasonCode } from '../../../domain/types';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { ErrorState } from '../../components/ErrorState';
import { Skeleton } from '../../components/Skeleton';

export interface DismissAlertDialogProps {
  alertId: string;
  loading: boolean;
  onSubmit: (reason: DismissReasonCode, comment: string | undefined) => void;
  onCancel: () => void;
}

function requiresText(reason: DismissReason | undefined): boolean {
  return !!reason && (reason.requiresText === true || reason.code === 'otro');
}

/**
 * Descarte como falso positivo: motivo obligatorio, texto obligatorio (≥ 10) si el motivo es "Otro"
 * y confirmación final con el botón "Descartar alerta". Se monta solo mientras está abierto.
 */
export function DismissAlertDialog({ alertId, loading, onSubmit, onCancel }: DismissAlertDialogProps) {
  const reasons = useDismissReasons();
  const [reasonCode, setReasonCode] = useState<DismissReasonCode | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const formId = useId();
  const commentId = useId();
  const reasonErrorId = useId();
  const commentErrorId = useId();
  const counterId = useId();

  const selected = reasons.data?.find((r) => r.code === reasonCode);
  const textRequired = requiresText(selected);
  const trimmed = comment.trim();
  const reasonError = submitted && !reasonCode ? 'Selecciona un motivo.' : '';
  const commentError =
    submitted && textRequired && trimmed.length < TEXT_LIMITS.dismissOtherMin
      ? `Describe el motivo con al menos ${TEXT_LIMITS.dismissOtherMin} caracteres.`
      : '';

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!reasonCode) return;
    if (textRequired && trimmed.length < TEXT_LIMITS.dismissOtherMin) return;
    onSubmit(reasonCode, trimmed ? trimmed : undefined);
  };

  return (
    <Dialog
      open
      onClose={onCancel}
      title={`Marcar ${alertId} como falso positivo`}
      description="La alerta se cerrará como descartada y quedará registrado el motivo. Esta acción no se puede deshacer."
      preventClose={loading}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} variant="danger" loading={loading} disabled={!reasons.data}>
            Descartar alerta
          </Button>
        </>
      }
    >
      {reasons.isPending && <Skeleton rows={4} label="Cargando motivos…" />}
      {reasons.isError && (
        <ErrorState
          title="No se pudieron cargar los motivos"
          message={reasons.error.message}
          onRetry={() => void reasons.refetch()}
          retrying={reasons.isFetching}
        />
      )}
      {reasons.data && (
        <form id={formId} onSubmit={submit} noValidate className="space-y-4">
          <fieldset
            aria-describedby={reasonError ? reasonErrorId : undefined}
            aria-invalid={reasonError ? true : undefined}
            className="space-y-2"
          >
            <legend className="mb-2 text-sm font-medium text-slate-800">Motivo</legend>
            {reasons.data.map((reason) => (
              <label
                key={reason.code}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 hover:bg-slate-50 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-600/5"
              >
                <input
                  type="radio"
                  name="dismiss-reason"
                  value={reason.code}
                  checked={reasonCode === reason.code}
                  disabled={loading}
                  onChange={() => setReasonCode(reason.code)}
                  className="size-4 accent-brand-600"
                />
                {reason.label}
              </label>
            ))}
            <p id={reasonErrorId} className="text-xs text-sev-critica-text" aria-live="polite">
              {reasonError}
            </p>
          </fieldset>

          <div className="space-y-1">
            <label htmlFor={commentId} className="text-sm font-medium text-slate-800">
              Comentario {textRequired ? '(obligatorio)' : '(opcional)'}
            </label>
            <textarea
              id={commentId}
              value={comment}
              maxLength={TEXT_LIMITS.commentMax}
              rows={3}
              disabled={loading}
              required={textRequired}
              aria-invalid={commentError ? true : undefined}
              aria-describedby={commentError ? `${commentErrorId} ${counterId}` : counterId}
              onChange={(event) => setComment(event.target.value)}
              className="w-full rounded-md border border-slate-300 bg-surface px-3 py-2 text-sm aria-invalid:border-sev-critica-text"
            />
            <div className="flex items-start justify-between gap-3 text-xs">
              <p id={commentErrorId} className="text-sev-critica-text" aria-live="polite">
                {commentError}
              </p>
              <p id={counterId} className="tabular shrink-0 text-slate-600">
                {comment.length} / {TEXT_LIMITS.commentMax}
              </p>
            </div>
          </div>
        </form>
      )}
    </Dialog>
  );
}
