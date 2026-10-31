import { useId, useState, type FormEvent } from 'react';
import { INCIDENT_TEXT_LIMITS, type Team } from '../../../domain/types';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';

export interface EscalateIncidentDialogProps {
  incidentId: string;
  /** Todos los equipos: el diálogo solo ofrece los especializados. */
  teams: readonly Team[];
  loading: boolean;
  onSubmit: (teamId: string, reason: string) => void;
  onCancel: () => void;
}

/**
 * Escalado a un equipo especializado: equipo obligatorio, motivo de 10 o más caracteres y
 * confirmación final con "Escalar incidente". Se monta solo mientras está abierto.
 */
export function EscalateIncidentDialog({ incidentId, teams, loading, onSubmit, onCancel }: EscalateIncidentDialogProps) {
  const specialized = teams.filter((t) => t.specialized);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const formId = useId();
  const teamErrorId = useId();
  const reasonId = useId();
  const reasonErrorId = useId();
  const counterId = useId();

  const trimmed = reason.trim();
  const teamError = submitted && !teamId ? 'Selecciona un equipo especializado.' : '';
  const reasonError =
    submitted && trimmed.length < INCIDENT_TEXT_LIMITS.reasonMin
      ? `El motivo debe tener al menos ${INCIDENT_TEXT_LIMITS.reasonMin} caracteres.`
      : '';

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!teamId || trimmed.length < INCIDENT_TEXT_LIMITS.reasonMin) return;
    onSubmit(teamId, trimmed);
  };

  return (
    <Dialog
      open
      onClose={onCancel}
      title={`Escalar ${incidentId}`}
      description="El incidente pasará a escalado y el equipo especializado quedará a cargo. Esta acción queda registrada con tu perfil."
      preventClose={loading}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={loading} disabled={specialized.length === 0}>
            Escalar incidente
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} noValidate className="space-y-4">
        <fieldset
          aria-describedby={teamError ? teamErrorId : undefined}
          aria-invalid={teamError ? true : undefined}
          className="space-y-2"
        >
          <legend className="mb-2 text-sm font-medium text-slate-800">Equipo especializado</legend>
          {specialized.length === 0 && (
            <p className="text-sm text-slate-600">No hay equipos especializados disponibles.</p>
          )}
          {specialized.map((team) => (
            <label
              key={team.id}
              className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 hover:bg-slate-50 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-600/5"
            >
              <input
                type="radio"
                name="escalate-team"
                value={team.id}
                checked={teamId === team.id}
                disabled={loading}
                onChange={() => setTeamId(team.id)}
                className="mt-0.5 size-4 accent-brand-600"
              />
              <span>
                <span className="font-medium">{team.name}</span>
                <span className="block text-xs text-slate-600">{team.specialty}</span>
              </span>
            </label>
          ))}
          <p id={teamErrorId} className="text-xs text-sev-critica-text" aria-live="polite">
            {teamError}
          </p>
        </fieldset>

        <div className="space-y-1">
          <label htmlFor={reasonId} className="text-sm font-medium text-slate-800">
            Motivo (obligatorio)
          </label>
          <textarea
            id={reasonId}
            value={reason}
            maxLength={INCIDENT_TEXT_LIMITS.reasonMax}
            rows={3}
            disabled={loading}
            required
            aria-invalid={reasonError ? true : undefined}
            aria-describedby={reasonError ? `${reasonErrorId} ${counterId}` : counterId}
            onChange={(event) => setReason(event.target.value)}
            className="w-full rounded-md border border-slate-300 bg-surface px-3 py-2 text-sm aria-invalid:border-sev-critica-text"
          />
          <div className="flex items-start justify-between gap-3 text-xs">
            <p id={reasonErrorId} className="text-sev-critica-text" aria-live="polite">
              {reasonError}
            </p>
            <p id={counterId} className="tabular shrink-0 text-slate-600">
              {reason.length} / {INCIDENT_TEXT_LIMITS.reasonMax}
            </p>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
