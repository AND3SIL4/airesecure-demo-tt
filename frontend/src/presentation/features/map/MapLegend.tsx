import { RISK_LEVEL_META } from '../../../domain/severity';
import { RISK_COLORS } from '../../../domain/map3d';
import type { RiskLevel } from '../../../domain/types';

const LEGEND_ORDER: readonly RiskLevel[] = ['critica', 'alta', 'media', 'baja', 'normal'];

/** Leyenda de la escena 3D: colores de riesgo, zonas restringidas y marcadores (siempre con texto). */
export function MapLegend({ className = '' }: { className?: string }) {
  return (
    <ul aria-label="Leyenda del mapa" className={`flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 ${className}`}>
      {LEGEND_ORDER.map((level) => (
        <li key={level} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-3 rounded-sm border border-slate-400"
            style={{ backgroundColor: RISK_COLORS[level] }}
          />
          Riesgo {RISK_LEVEL_META[level].label.toLowerCase()}
        </li>
      ))}
      <li className="inline-flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="size-3 rounded-sm border-2 border-navy-950"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #5b6474 0 2px, #ffffff 2px 5px)',
          }}
        />
        Restringida (borde oscuro y rayado)
      </li>
      <li className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className="size-2.5 rounded-full bg-sev-alta ring-1 ring-white" />
        Marcador: alerta activa (las críticas pulsan, salvo con movimiento reducido)
      </li>
    </ul>
  );
}
