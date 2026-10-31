import { RotateCcw, TriangleAlert } from 'lucide-react';
import { useId, useRef, useState, type FormEvent } from 'react';
import { RESET_CONFIRMATION_WORD } from '../../../domain/settings';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';

export interface DangerZoneProps {
  resetting: boolean;
  /** `onError` permite volver a enviar tras un fallo (libera la guarda de doble envío). */
  onReset: (callbacks: { onError: () => void }) => void;
}

/** Zona de peligro (doc 09 §3.10, HU-26): reiniciar la demo exige escribir exactamente REINICIAR. */
export function DangerZone({ resetting, onReset }: DangerZoneProps) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  // Guarda síncrona contra el doble envío (Enter + clic antes de que `resetting` se propague).
  const submittingRef = useRef<boolean>(false);
  const titleId = useId();
  const formId = useId();
  const inputId = useId();
  const hintId = useId();

  const matches = confirmation === RESET_CONFIRMATION_WORD;

  const close = () => {
    if (resetting) return;
    submittingRef.current = false;
    setOpen(false);
    setConfirmation('');
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!matches || resetting || submittingRef.current) return;
    submittingRef.current = true;
    onReset({
      onError: () => {
        submittingRef.current = false;
      },
    });
  };

  return (
    <section aria-labelledby={titleId} className="rounded-lg border border-sev-critica/40 bg-surface p-4 shadow-sm">
      <h2 id={titleId} className="mb-2 flex items-center gap-2 text-base font-semibold text-sev-critica-text">
        <TriangleAlert aria-hidden="true" className="size-5" />
        Zona de peligro
      </h2>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-slate-700">
          Reinicia la demo: borra alertas, incidentes e historia y genera datos nuevos relativos a la hora actual. Se
          conserva el estado del simulador; los umbrales vuelven a sus valores por defecto.
        </p>
        <Button variant="danger" icon={RotateCcw} onClick={() => setOpen(true)}>
          Reiniciar demo
        </Button>
      </div>

      <Dialog
        open={open}
        onClose={close}
        title="Reiniciar la demo"
        initialFocusRef={inputRef}
        preventClose={resetting}
        description={
          <>
            Se borrarán todas las alertas, los incidentes y su historia, y se generarán datos nuevos. Todas las pestañas
            abiertas volverán al Resumen. <strong className="text-slate-900">Esta acción no se puede deshacer.</strong>
          </>
        }
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={resetting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form={formId}
              variant="danger"
              icon={RotateCcw}
              loading={resetting}
              disabled={!matches}
            >
              Reiniciar demo
            </Button>
          </>
        }
      >
        <form id={formId} onSubmit={submit} noValidate className="space-y-1">
          <label htmlFor={inputId} className="text-sm font-medium text-slate-800">
            Escribe <span className="font-mono font-semibold">{RESET_CONFIRMATION_WORD}</span> para confirmar
          </label>
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            value={confirmation}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            disabled={resetting}
            aria-describedby={hintId}
            onChange={(event) => setConfirmation(event.target.value)}
            className="h-10 w-full rounded-md border border-slate-300 bg-surface px-3 font-mono text-sm"
          />
          <p id={hintId} className="text-xs text-slate-600" aria-live="polite">
            {matches ? 'Confirmación correcta.' : 'Distingue mayúsculas y minúsculas.'}
          </p>
        </form>
      </Dialog>
    </section>
  );
}
