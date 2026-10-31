import { Save } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { formatNumber } from '../../../domain/format';
import { THRESHOLD_RANGE, diffThresholds, formatThreshold, thresholdInputValue } from '../../../domain/settings';
import type { SettingsUpdate } from '../../../domain/types';
import { Button } from '../../components/Button';

export interface ThresholdsTableProps {
  thresholds: Record<string, number>;
  typeNames: Record<string, string>;
  belowThreshold: number;
  saving: boolean;
  onSave: (update: SettingsUpdate, onDone?: () => void) => void;
}

/**
 * Umbrales de confianza por tipo (doc 09 §3.10, HU-29): input de 0,50-0,99 con errores en línea.
 * "Guardar cambios" solo se habilita si hay cambios válidos; los inválidos no se envían.
 */
export function ThresholdsTable({ thresholds, typeNames, belowThreshold, saving, onSave }: ThresholdsTableProps) {
  // Solo los tipos editados; el resto muestra el valor guardado (y se sincroniza con otras pestañas).
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const codes = Object.keys(thresholds).sort((a, b) => (typeNames[a] ?? a).localeCompare(typeNames[b] ?? b, 'es'));

  const { changes, errors } = diffThresholds(drafts, thresholds);
  const changeCount = Object.keys(changes).length;
  const hasErrors = Object.keys(errors).length > 0;
  const hasDrafts = Object.keys(drafts).length > 0;

  const setDraft = (code: string, value: string) => setDrafts((prev) => ({ ...prev, [code]: value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (hasErrors || changeCount === 0 || saving) return;
    onSave({ thresholds: changes }, () => setDrafts({}));
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      <div className="relative overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <caption className="sr-only">Umbral de confianza por tipo de alerta</caption>
          <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase">
            <tr>
              <th scope="col" className="px-4 py-2">
                Tipo de alerta
              </th>
              <th scope="col" className="px-4 py-2">
                Umbral actual
              </th>
              <th scope="col" className="px-4 py-2">
                Nuevo umbral
              </th>
            </tr>
          </thead>
          <tbody>
            {codes.map((code) => {
              const saved = thresholds[code] ?? 0;
              const inputId = `threshold-${code}`;
              const errorId = `threshold-${code}-error`;
              const error = errors[code];
              const changed = code in changes;
              return (
                <tr key={code} className="border-t border-slate-100">
                  <th scope="row" className="px-4 py-2 text-left font-medium text-slate-900">
                    <label htmlFor={inputId}>{typeNames[code] ?? code}</label>
                  </th>
                  <td className="tabular px-4 py-2 text-slate-700">{formatThreshold(saved)}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <input
                        id={inputId}
                        type="number"
                        inputMode="decimal"
                        min={THRESHOLD_RANGE.min}
                        max={THRESHOLD_RANGE.max}
                        step={THRESHOLD_RANGE.step}
                        value={drafts[code] ?? thresholdInputValue(saved)}
                        disabled={saving}
                        aria-invalid={error ? true : undefined}
                        aria-describedby={error ? errorId : undefined}
                        onChange={(event) => setDraft(code, event.target.value)}
                        className={`tabular h-9 w-24 rounded-md border bg-surface px-2 text-right aria-invalid:border-sev-critica-text ${changed ? 'border-brand-600' : 'border-slate-300'}`}
                      />
                      {changed && <span className="text-xs font-medium text-brand-700">Modificado</span>}
                    </div>
                    {error && (
                      <p id={errorId} className="mt-1 text-xs text-sev-critica-text">
                        {error}
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-600">
          Los cambios solo afectan a los eventos nuevos del simulador. Eventos bajo umbral desde la siembra:{' '}
          <span className="tabular font-semibold text-slate-900">{formatNumber(belowThreshold, 0)}</span>
        </p>
        <div className="flex gap-2">
          {hasDrafts && (
            <Button variant="ghost" size="sm" disabled={saving} onClick={() => setDrafts({})}>
              Descartar cambios
            </Button>
          )}
          <Button type="submit" size="sm" icon={Save} loading={saving} disabled={changeCount === 0 || hasErrors}>
            Guardar cambios
          </Button>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {hasErrors ? 'Hay umbrales con valores fuera de rango.' : ''}
      </p>
    </form>
  );
}
