import { useId, useState } from 'react';
import { INCIDENT_TEXT_LIMITS } from '../../../domain/types';
import { ConfirmDialog } from '../../components/ConfirmDialog';

export interface ResolveIncidentDialogProps {
  incidentId: string;
  loading: boolean;
  onConfirm: (note: string) => void;
  onCancel: () => void;
}

/** Cierre del incidente con nota obligatoria (10 o más caracteres). Se monta solo mientras está abierto. */
export function ResolveIncidentDialog({ incidentId, loading, onConfirm, onCancel }: ResolveIncidentDialogProps) {
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const noteId = useId();
  const errorId = useId();
  const counterId = useId();
  const trimmed = note.trim();
  const tooShort = trimmed.length < INCIDENT_TEXT_LIMITS.resolutionNoteMin;
  const error =
    submitted && tooShort
      ? `La nota de cierre debe tener al menos ${INCIDENT_TEXT_LIMITS.resolutionNoteMin} caracteres.`
      : '';

  return (
    <ConfirmDialog
      open
      title={`¿Resolver ${incidentId}?`}
      description="El incidente se cerrará como resuelto con la nota de cierre. Esta acción no se puede deshacer."
      confirmLabel="Resolver incidente"
      loading={loading}
      onConfirm={() => {
        setSubmitted(true);
        if (!tooShort) onConfirm(trimmed);
      }}
      onCancel={onCancel}
    >
      <div className="space-y-1">
        <label htmlFor={noteId} className="text-sm font-medium text-slate-800">
          Nota de cierre (obligatoria)
        </label>
        <textarea
          id={noteId}
          value={note}
          maxLength={INCIDENT_TEXT_LIMITS.resolutionNoteMax}
          rows={4}
          disabled={loading}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${errorId} ${counterId}` : counterId}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Qué se hizo y cómo quedó la situación"
          className="w-full rounded-md border border-slate-300 bg-surface px-3 py-2 text-sm placeholder:text-slate-500 aria-invalid:border-sev-critica-text"
        />
        <div className="flex items-start justify-between gap-3 text-xs">
          <p id={errorId} className="text-sev-critica-text" aria-live="polite">
            {error}
          </p>
          <p id={counterId} className="tabular shrink-0 text-slate-600">
            {note.length} / {INCIDENT_TEXT_LIMITS.resolutionNoteMax}
          </p>
        </div>
      </div>
    </ConfirmDialog>
  );
}
