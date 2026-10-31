import { describeVariation, KPI_DEFINITIONS } from '../../../domain/kpis';
import type { DashboardSummary } from '../../../domain/types';
import { KPI_ICONS } from '../../components/icons';
import { KpiCard } from '../../components/KpiCard';

export interface KpiRowProps {
  kpis: DashboardSummary['kpis'];
  deltas: DashboardSummary['deltas'];
}

/** Fila de los 5 KPI con su variación frente a ayer (doc 09 §3.2, fila 1). */
export function KpiRow({ kpis, deltas }: KpiRowProps) {
  return (
    <section aria-label="Indicadores clave" className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      {KPI_DEFINITIONS.map((def) => (
        <KpiCard
          key={def.key}
          icon={KPI_ICONS[def.icon]}
          label={def.label}
          value={def.format(kpis[def.key])}
          variation={describeVariation(deltas[def.key], def)}
        />
      ))}
    </section>
  );
}
