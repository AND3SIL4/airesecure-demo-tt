import { CalendarDays } from 'lucide-react';
import { useId } from 'react';
import { DATE_RANGES, DATE_RANGE_LABELS, type DateRangeValue } from '../../domain/dateRanges';

export interface DateRangePresetsProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  label?: string;
  className?: string;
}

/**
 * Rango de fechas: Hoy / 7 días / 30 días / Personalizado. Los presets son botones con
 * `aria-pressed`; "Personalizado" muestra dos `<input type="date">` con su etiqueta.
 */
export function DateRangePresets({
  value,
  onChange,
  label = 'Rango de fechas',
  className = '',
}: DateRangePresetsProps) {
  const fromId = useId();
  const toId = useId();
  const invalidId = useId();
  const invalid = value.range === 'custom' && value.from !== '' && value.to !== '' && value.from > value.to;

  return (
    <div role="group" aria-label={label} className={`flex flex-wrap items-center gap-2 ${className}`}>
      <CalendarDays aria-hidden="true" className="size-4 text-slate-500" />
      <div className="inline-flex rounded-md border border-slate-300 bg-surface p-0.5">
        {DATE_RANGES.map((range) => {
          const active = value.range === range;
          return (
            <button
              key={range}
              type="button"
              aria-pressed={active}
              onClick={() =>
                onChange({
                  range,
                  from: range === 'custom' ? value.from : '',
                  to: range === 'custom' ? value.to : '',
                })
              }
              className={[
                'h-8 rounded px-3 text-sm font-medium transition-colors duration-200',
                active ? 'bg-brand-600 text-white' : 'text-slate-700 hover:bg-slate-100',
              ].join(' ')}
            >
              {DATE_RANGE_LABELS[range]}
            </button>
          );
        })}
      </div>
      {value.range === 'custom' && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label htmlFor={fromId} className="text-slate-700">
            Desde
          </label>
          <input
            id={fromId}
            type="date"
            value={value.from}
            max={value.to || undefined}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? invalidId : undefined}
            onChange={(event) => onChange({ ...value, from: event.target.value })}
            className="h-9 rounded-md border border-slate-300 bg-surface px-2 text-sm aria-invalid:border-sev-critica-text"
          />
          <label htmlFor={toId} className="text-slate-700">
            Hasta
          </label>
          <input
            id={toId}
            type="date"
            value={value.to}
            min={value.from || undefined}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? invalidId : undefined}
            onChange={(event) => onChange({ ...value, to: event.target.value })}
            className="h-9 rounded-md border border-slate-300 bg-surface px-2 text-sm aria-invalid:border-sev-critica-text"
          />
          <p id={invalidId} aria-live="polite" className="text-xs text-sev-critica-text">
            {invalid ? 'La fecha inicial debe ser anterior a la final.' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
