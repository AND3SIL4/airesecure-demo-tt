import { useId, useRef, useState, type FormEvent } from 'react';
import { TEXT_LIMITS } from '../../../domain/types';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';

export interface CommentDialogProps {
  alertId: string;
  loading: boolean;
  onSubmit: (comment: string) => void;
  onCancel: () => void;
}

/** Comentario libre sobre la alerta (3 a 500 caracteres). Se monta solo mientras está abierto. */
export function CommentDialog({ alertId, loading, onSubmit, onCancel }: CommentDialogProps) {
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const formId = useId();
  const fieldId = useId();
  const hintId = useId();
  const errorId = useId();
  const trimmed = comment.trim();
  const tooShort = trimmed.length < TEXT_LIMITS.commentMin;
  const showError = submitted && tooShort;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (tooShort) return;
    onSubmit(trimmed);
  };

  return (
    <Dialog
      open
      onClose={onCancel}
      title={`Comentar ${alertId}`}
      description="El comentario queda en el historial de la alerta con tu perfil y la hora."
      preventClose={loading}
      initialFocusRef={fieldRef}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={loading}>
            Registrar comentario
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} noValidate className="space-y-1">
        <label htmlFor={fieldId} className="text-sm font-medium text-slate-800">
          Comentario
        </label>
        <textarea
          ref={fieldRef}
          id={fieldId}
          value={comment}
          maxLength={TEXT_LIMITS.commentMax}
          rows={4}
          disabled={loading}
          required
          aria-invalid={showError || undefined}
          aria-describedby={showError ? `${errorId} ${hintId}` : hintId}
          onChange={(event) => setComment(event.target.value)}
          className="w-full rounded-md border border-slate-300 bg-surface px-3 py-2 text-sm aria-invalid:border-sev-critica-text"
        />
        <div className="flex items-start justify-between gap-3 text-xs">
          <p id={errorId} className="text-sev-critica-text" aria-live="polite">
            {showError ? `Escribe al menos ${TEXT_LIMITS.commentMin} caracteres.` : ''}
          </p>
          <p id={hintId} className="tabular shrink-0 text-slate-600">
            {comment.length} / {TEXT_LIMITS.commentMax}
          </p>
        </div>
      </form>
    </Dialog>
  );
}
