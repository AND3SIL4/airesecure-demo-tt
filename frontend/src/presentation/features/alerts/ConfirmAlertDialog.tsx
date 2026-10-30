import { useId, useState } from 'react';
import { TEXT_LIMITS } from '../../../domain/types';
import { ConfirmDialog } from '../../components/ConfirmDialog';

export interface ConfirmAlertDialogProps {
  alertId: string;
  loading: boolean;
  onConfirm: (note: string | undefined) => void;
  onCancel: () => void;
}

/** Confirmación humana de la alerta: crea un incidente. Se monta solo mientras está abierto. */
export function ConfirmAlertDialog({ alertId, loading, onConfirm, onCancel }: ConfirmAlertDialogProps) {
  const [note, setNote] = useState('');
  const noteId = useId();
  const counterId = useId();
  const trimmed = note.trim();

  return (
    <ConfirmDialog
      open
      title={`¿Confirmar incidente para ${alertId}?`}
      description="Se creará un incidente abierto vinculado a esta alerta. Esta acción no se puede deshacer."
      confirmLabel="Confirmar incidente"
      loading={loading}
      onConfirm={() => onConfirm(trimmed ? trimmed : undefined)}
      onCancel={onCancel}
    >
      <div className="space-y-1">
        <label htmlFor={noteId} className="text-sm font-medium text-slate-800">
          Nota (opcional)
        </label>
        <textarea
          id={noteId}
          value={note}
          maxLength={TEXT_LIMITS.noteMax}
          rows={3}
          disabled={loading}
          aria-describedby={counterId}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Contexto para el equipo que atenderá el incidente"
          className="w-full rounded-md border border-slate-300 bg-surface px-3 py-2 text-sm placeholder:text-slate-500"
        />
        <p id={counterId} className="tabular text-right text-xs text-slate-600">
          {note.length} / {TEXT_LIMITS.noteMax}
        </p>
      </div>
    </ConfirmDialog>
  );
}
