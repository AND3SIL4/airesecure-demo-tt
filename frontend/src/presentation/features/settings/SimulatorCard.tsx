import { Save } from 'lucide-react';
import { useEffect, useId, useState, type FormEvent } from 'react';
import { INTERVAL_RANGE, simulatorStatus, validateInterval } from '../../../domain/settings';
import type { SettingsUpdate, SimulatorSettings } from '../../../domain/types';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';

export interface SimulatorCardProps {
  simulator: SimulatorSettings;
  saving: boolean;
  onSave: (update: SettingsUpdate, onDone?: () => void) => void;
}

/** Reloj local de 1 s para la cuenta regresiva (solo mientras el simulador está en marcha). */
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active]);
  return now;
}

/** Simulador (doc 09 §3.10): interruptor, intervalo de 15-300 s y estado con cuenta regresiva. */
export function SimulatorCard({ simulator, saving, onSave }: SimulatorCardProps) {
  const switchLabelId = useId();
  const sliderId = useId();
  const inputId = useId();
  const errorId = useId();
  const hintId = useId();
  // null = sin cambios locales: se muestra el valor guardado (y se sincroniza con otras pestañas).
  const [draft, setDraft] = useState<string | null>(null);

  const now = useNow(simulator.enabled && simulator.running);
  const status = simulatorStatus(simulator, now);

  const raw = draft ?? String(simulator.intervalSeconds);
  const parsed = validateInterval(raw);
  const error = parsed.ok ? '' : parsed.error;
  const dirty = parsed.ok ? parsed.value !== simulator.intervalSeconds : draft !== null;
  const sliderValue = parsed.ok ? parsed.value : simulator.intervalSeconds;

  const toggle = () => {
    if (saving) return;
    onSave({ simulator: { enabled: !simulator.enabled } });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!parsed.ok || !dirty || saving) return;
    onSave({ simulator: { intervalSeconds: parsed.value } }, () => setDraft(null));
  };

  return (
    <Card title="Simulador">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p id={switchLabelId} className="text-sm font-medium text-slate-900">
              Generación automática de eventos
            </p>
            <p className="text-xs text-slate-600">Crea alertas demostrativas basadas en reglas cada cierto intervalo.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={simulator.enabled}
            aria-labelledby={switchLabelId}
            aria-busy={saving || undefined}
            // aria-disabled (no `disabled`) para no perder el foco mientras se guarda; `toggle` ignora el clic.
            aria-disabled={saving || undefined}
            onClick={toggle}
            className={[
              'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 border-transparent',
              'motion-safe:transition-colors motion-safe:duration-200 aria-disabled:cursor-not-allowed aria-disabled:opacity-60',
              simulator.enabled ? 'bg-ok-text' : 'bg-slate-400',
            ].join(' ')}
          >
            <span className="sr-only">{simulator.enabled ? 'Encendido' : 'Apagado'}</span>
            <span
              aria-hidden="true"
              className={[
                'inline-block size-6 rounded-full bg-white shadow motion-safe:transition-transform motion-safe:duration-200',
                simulator.enabled ? 'translate-x-5' : 'translate-x-0',
              ].join(' ')}
            />
          </button>
        </div>

        <p
          aria-live="polite"
          className={`flex items-center gap-2 text-sm font-medium ${status.tone === 'running' ? 'text-ok-text' : 'text-slate-700'}`}
        >
          <span
            aria-hidden="true"
            className={`size-2.5 rounded-full ${status.tone === 'running' ? 'bg-ok motion-safe:animate-pulse' : 'bg-slate-400'}`}
          />
          {/* La cuenta regresiva cambia cada segundo: solo se anuncia el cambio de estado, no cada número. */}
          <span aria-hidden="true" className="tabular">
            {status.label}
          </span>
          <span className="sr-only">{status.tone === 'running' ? 'Simulador en ejecución' : 'Simulador detenido'}</span>
        </p>

        <form onSubmit={submit} noValidate className="space-y-2">
          <label htmlFor={sliderId} className="text-sm font-medium text-slate-900">
            Intervalo entre eventos
          </label>
          <div className="flex items-center gap-3">
            <input
              id={sliderId}
              type="range"
              min={INTERVAL_RANGE.min}
              max={INTERVAL_RANGE.max}
              step={INTERVAL_RANGE.sliderStep}
              value={sliderValue}
              disabled={saving}
              aria-valuetext={`${sliderValue} segundos`}
              aria-describedby={hintId}
              onChange={(event) => setDraft(event.target.value)}
              className="h-2 flex-1 cursor-pointer accent-brand-600 disabled:cursor-not-allowed"
            />
            <div className="flex items-center gap-1.5">
              <label htmlFor={inputId} className="sr-only">
                Intervalo en segundos
              </label>
              <input
                id={inputId}
                type="number"
                inputMode="numeric"
                min={INTERVAL_RANGE.min}
                max={INTERVAL_RANGE.max}
                step={1}
                value={raw}
                disabled={saving}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${errorId} ${hintId}` : hintId}
                onChange={(event) => setDraft(event.target.value)}
                className="tabular h-9 w-20 rounded-md border border-slate-300 bg-surface px-2 text-right text-sm aria-invalid:border-sev-critica-text"
              />
              <span className="text-sm text-slate-600">s</span>
            </div>
          </div>
          <p id={hintId} className="text-xs text-slate-600">
            Entre {INTERVAL_RANGE.min} y {INTERVAL_RANGE.max} segundos. El cambio se aplica sin reiniciar el servidor.
          </p>
          <p id={errorId} aria-live="polite" className="text-xs text-sev-critica-text">
            {error}
          </p>
          <div className="flex justify-end gap-2">
            {draft !== null && (
              <Button variant="ghost" size="sm" disabled={saving} onClick={() => setDraft(null)}>
                Descartar
              </Button>
            )}
            <Button type="submit" size="sm" icon={Save} loading={saving} disabled={!dirty || !parsed.ok}>
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
