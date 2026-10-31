import { formatNumber } from '../../../domain/format';

interface TooltipEntry {
  name?: string | number;
  value?: number | string | readonly (number | string)[] | null;
  color?: string;
}

export interface SeriesTooltipProps {
  labelFormatter?: (label: string | number) => string;
  /** Texto de cada valor (por defecto, el número). */
  formatValue?: (value: number) => string;
  /** Línea final con la suma de las series (gráficos apilados). */
  totalLabel?: string;
  /** Invierte el orden para leer de arriba abajo como en una pila. */
  reverse?: boolean;
  // Inyectados por Recharts.
  active?: boolean;
  payload?: readonly TooltipEntry[];
  label?: string | number;
}

function toNumber(raw: TooltipEntry['value']): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

const defaultFormat = (value: number) => formatNumber(value, 0);

/** Tooltip de varias series: una fila por serie con su muestra de color, nombre y valor. */
export function SeriesTooltip({
  labelFormatter,
  formatValue = defaultFormat,
  totalLabel,
  reverse = false,
  active,
  payload,
  label,
}: SeriesTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const entries = reverse ? [...payload].reverse() : payload;
  const title = label === undefined ? null : labelFormatter ? labelFormatter(label) : String(label);
  const total = entries.reduce((sum, e) => sum + (toNumber(e.value) ?? 0), 0);

  return (
    <div className="rounded-md border border-slate-200 bg-surface px-3 py-2 text-sm shadow-md">
      {title && <p className="mb-1 font-medium text-slate-900">{title}</p>}
      <ul className="space-y-0.5">
        {entries.map((entry) => {
          const value = toNumber(entry.value);
          return (
            <li key={String(entry.name)} className="flex items-center gap-2 text-slate-700">
              <span aria-hidden="true" className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: entry.color }} />
              <span className="flex-1">{entry.name}</span>
              <span className="tabular font-medium text-slate-900">
                {value === null ? 'Sin datos' : formatValue(value)}
              </span>
            </li>
          );
        })}
      </ul>
      {totalLabel && (
        <p className="tabular mt-1 border-t border-slate-200 pt-1 font-medium text-slate-900">
          {totalLabel}: {formatValue(total)}
        </p>
      )}
    </div>
  );
}
