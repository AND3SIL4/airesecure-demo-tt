import { useId, useRef, useState, type FormEvent } from 'react';
import { teamOptionLabel } from '../../../domain/teams';
import { TEXT_LIMITS, type Team } from '../../../domain/types';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';

export interface AssignTeamDialogProps {
  incidentId: string;
  teams: readonly Team[];
  currentTeamId: string | null;
  /** Equipo preseleccionado (el elegido en el selector del panel). */
  initialTeamId: string | null;
  loading: boolean;
  onSubmit: (teamId: string, comment: string | undefined) => void;
  onCancel: () => void;
}

/** Asignación de equipo con comentario opcional. Se monta solo mientras está abierto. */
export function AssignTeamDialog({
  incidentId,
  teams,
  currentTeamId,
  initialTeamId,
  loading,
  onSubmit,
  onCancel,
}: AssignTeamDialogProps) {
  const [teamId, setTeamId] = useState(initialTeamId ?? '');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);
  const formId = useId();
  const selectId = useId();
  const teamErrorId = useId();
  const commentId = useId();
  const counterId = useId();

  const teamError = submitted && !teamId ? 'Selecciona un equipo.' : '';
  const sameTeam = teamId !== '' && teamId === currentTeamId;
  const selected = teams.find((t) => t.id === teamId);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!teamId || sameTeam) return;
    const trimmed = comment.trim();
    onSubmit(teamId, trimmed ? trimmed : undefined);
  };

  return (
    <Dialog
      open
      onClose={onCancel}
      title={`Asignar equipo a ${incidentId}`}
      description="El equipo asignado queda en el historial del incidente con tu perfil y la hora."
      preventClose={loading}
      initialFocusRef={selectRef}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={loading} disabled={sameTeam}>
            Asignar
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} noValidate className="space-y-4">
        <div className="space-y-1">
          <label htmlFor={selectId} className="text-sm font-medium text-slate-800">
            Equipo
          </label>
          <select
            ref={selectRef}
            id={selectId}
            value={teamId}
            disabled={loading}
            required
            aria-invalid={teamError ? true : undefined}
            aria-describedby={teamErrorId}
            onChange={(event) => setTeamId(event.target.value)}
            className="h-10 w-full rounded-md border border-slate-300 bg-surface px-3 text-sm aria-invalid:border-sev-critica-text"
          >
            <option value="">Selecciona un equipo</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {teamOptionLabel(team)}
                {team.id === currentTeamId ? ' (actual)' : ''}
              </option>
            ))}
          </select>
          <p id={teamErrorId} className="text-xs text-sev-critica-text" aria-live="polite">
            {teamError || (sameTeam ? 'Ese equipo ya está asignado; elige otro.' : '')}
          </p>
          {selected && <p className="text-xs text-slate-600">Especialidad: {selected.specialty}</p>}
        </div>

        <div className="space-y-1">
          <label htmlFor={commentId} className="text-sm font-medium text-slate-800">
            Comentario (opcional)
          </label>
          <textarea
            id={commentId}
            value={comment}
            maxLength={TEXT_LIMITS.commentMax}
            rows={3}
            disabled={loading}
            aria-describedby={counterId}
            onChange={(event) => setComment(event.target.value)}
            className="w-full rounded-md border border-slate-300 bg-surface px-3 py-2 text-sm"
          />
          <p id={counterId} className="tabular text-right text-xs text-slate-600">
            {comment.length} / {TEXT_LIMITS.commentMax}
          </p>
        </div>
      </form>
    </Dialog>
  );
}
