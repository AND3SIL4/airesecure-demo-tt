import { formatNumber } from '../../../domain/format';

interface TooltipEntry {
  name?: string | number;
  value?: number | string | readonly (number | string)[];
}

export interface ChartTooltipProps {
  /** Unidad en singular y plural ("incidente" / "incidentes"). */
  unit: { one: string; many: string };
  labelFormatter?: (label: string | number) => string;
  // Inyectados por Recharts.
  active?: boolean;
  payload?: readonly TooltipEntry[];
  label?: string | number;
}

/** Tooltip de los gráficos del Resumen: tarjeta clara con el nombre y el valor. */
export function ChartTooltip({ unit, labelFormatter, active, payload, label }: ChartTooltipProps) {
  const entry = payload?.[0];
  if (!active || !entry) return null;
  const raw = Array.isArray(entry.value) ? entry.value[0] : entry.value;
  const value = typeof raw === 'number' ? raw : Number(raw ?? 0);
  const title = label !== undefined && label !== '' ? (labelFormatter ? labelFormatter(label) : String(label)) : entry.name;

  return (
    <div className="rounded-md border border-slate-200 bg-surface px-3 py-2 text-sm shadow-md">
      {title !== undefined && <p className="font-medium text-slate-900">{title}</p>}
      <p className="tabular text-slate-700">
        {formatNumber(value, 0)} {value === 1 ? unit.one : unit.many}
      </p>
    </div>
  );
}
