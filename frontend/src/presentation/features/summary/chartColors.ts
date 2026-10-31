// Colores de los gráficos a partir de los tokens del tema (index.css).
const CHART_PALETTE = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
  'var(--color-chart-6)',
  'var(--color-chart-7)',
] as const;

export function chartColor(index: number): string {
  return CHART_PALETTE[index % CHART_PALETTE.length] ?? CHART_PALETTE[0];
}

export const CHART_LINE_COLOR = 'var(--color-brand-600)';
export const CHART_GRID_COLOR = 'var(--color-slate-200)';
export const CHART_AXIS_COLOR = 'var(--color-slate-600)';
