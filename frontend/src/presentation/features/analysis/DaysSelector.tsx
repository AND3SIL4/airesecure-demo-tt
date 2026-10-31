import { CalendarDays } from 'lucide-react';
import { ANALYTICS_DAYS, daysLabel, type AnalyticsDays } from '../../../domain/analytics';

export interface DaysSelectorProps {
  value: AnalyticsDays;
  onChange: (days: AnalyticsDays) => void;
}

/** Selector de rango de Análisis (7, 14 o 30 días): botones con `aria-pressed`. */
export function DaysSelector({ value, onChange }: DaysSelectorProps) {
  return (
    <div role="group" aria-label="Rango de días" className="flex items-center gap-2">
      <CalendarDays aria-hidden="true" className="size-4 text-slate-500" />
      <span className="text-sm text-slate-700">Rango:</span>
      <div className="inline-flex rounded-md border border-slate-300 bg-surface p-0.5">
        {ANALYTICS_DAYS.map((days) => {
          const active = value === days;
          return (
            <button
              key={days}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(days)}
              className={[
                'h-8 rounded px-3 text-sm font-medium transition-colors duration-200',
                active ? 'bg-brand-600 text-white' : 'text-slate-700 hover:bg-slate-100',
              ].join(' ')}
            >
              {daysLabel(days)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
