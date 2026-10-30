import { RISK_LEVEL_META } from '../../domain/severity';
import type { RiskLevel, Zone } from '../../domain/types';

export interface MiniMap2DProps {
  zones: readonly Zone[];
  /** Zona a resaltar (borde grueso y nombre). */
  highlightZoneId?: string;
  className?: string;
}

// Losa de 120 × 80 m centrada en (0,0); +Z apunta a la plataforma, que se dibuja arriba (Z invertido).
const SLAB_W = 120;
const SLAB_D = 80;

const RISK_FILL: Record<RiskLevel, string> = {
  critica: 'fill-sev-critica/35',
  alta: 'fill-sev-alta/30',
  media: 'fill-sev-media/30',
  baja: 'fill-sev-baja/20',
  normal: 'fill-ok/15',
};

const RISK_SWATCH: Record<RiskLevel, string> = {
  critica: 'bg-sev-critica/35 border-sev-critica',
  alta: 'bg-sev-alta/30 border-sev-alta',
  media: 'bg-sev-media/30 border-sev-media',
  baja: 'bg-sev-baja/20 border-sev-baja',
  normal: 'bg-ok/15 border-ok',
};

const LEGEND_ORDER: readonly RiskLevel[] = ['critica', 'alta', 'media', 'baja', 'normal'];

function toSvgRect(zone: Zone) {
  const { x, z, w, d } = zone.geometry;
  return { x: x - w / 2 + SLAB_W / 2, y: SLAB_D / 2 - z - d / 2, w, h: d };
}

// Ancho medio estimado de un carácter (en unidades de fontSize) y margen interior de la etiqueta.
const CHAR_WIDTH_EM = 0.6;
const LABEL_PADDING = 1.5;

/** Tamaño de letra de la etiqueta si cabe dentro de la zona; `null` si no cabe (el nombre ya va bajo el plano). */
function insideLabelFontSize(name: string, rect: { w: number; h: number }): number | null {
  const fontSize = Math.min(4, Math.max(2.4, rect.w / 8));
  const textWidth = name.length * fontSize * CHAR_WIDTH_EM;
  if (textWidth > rect.w - LABEL_PADDING * 2 || fontSize > rect.h - LABEL_PADDING * 2) return null;
  return fontSize;
}

/** Plano 2D de la terminal (research R10): zonas coloreadas por riesgo y la zona resaltada. */
export function MiniMap2D({ zones, highlightZoneId, className = '' }: MiniMap2DProps) {
  const highlighted = zones.find((z) => z.id === highlightZoneId);
  const withAlerts = zones.filter((z) => z.activeAlerts > 0).length;
  const ariaLabel = [
    'Plano de la Terminal 1.',
    highlighted
      ? `Zona resaltada: ${highlighted.name}, riesgo ${RISK_LEVEL_META[highlighted.riskLevel].label.toLowerCase()}.`
      : '',
    `${withAlerts} de ${zones.length} zonas con alertas activas.`,
  ]
    .filter(Boolean)
    .join(' ');
  const hl = highlighted ? toSvgRect(highlighted) : null;
  const labelFontSize = highlighted && hl ? insideLabelFontSize(highlighted.name, hl) : null;

  return (
    <div className={className}>
      <svg
        role="img"
        aria-label={ariaLabel}
        viewBox={`0 0 ${SLAB_W} ${SLAB_D}`}
        className="h-auto w-full rounded-md border border-slate-200 bg-surface-muted"
      >
        <rect x={0.5} y={0.5} width={SLAB_W - 1} height={SLAB_D - 1} rx={2} className="fill-slate-100 stroke-slate-300" strokeWidth={0.4} />
        {zones.map((zone) => {
          const r = toSvgRect(zone);
          const isHl = zone.id === highlightZoneId;
          return (
            <rect
              key={zone.id}
              x={r.x}
              y={r.y}
              width={r.w}
              height={r.h}
              rx={1}
              className={`${RISK_FILL[zone.riskLevel]} ${isHl ? 'stroke-navy-950' : 'stroke-slate-400'}`}
              strokeWidth={isHl ? 1.2 : 0.35}
              strokeDasharray={zone.restricted && !isHl ? '1.5 1' : undefined}
            />
          );
        })}
        {highlighted && hl && labelFontSize !== null && (
          <g>
            <text
              x={hl.x + hl.w / 2}
              y={hl.y + hl.h / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-navy-950 font-semibold"
              fontSize={labelFontSize}
              paintOrder="stroke"
              stroke="white"
              strokeWidth={0.8}
            >
              {highlighted.name}
            </text>
          </g>
        )}
      </svg>

      {highlighted && (
        <p className="mt-2 text-sm text-slate-700">
          <span className="font-medium text-slate-900">{highlighted.name}</span>
          {highlighted.restricted && <span> · zona restringida</span>}
          <span> · criticidad {highlighted.criticality} de 3</span>
        </p>
      )}

      <ul aria-label="Leyenda de riesgo" className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
        {LEGEND_ORDER.map((level) => (
          <li key={level} className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className={`size-3 rounded-sm border ${RISK_SWATCH[level]}`} />
            {RISK_LEVEL_META[level].label}
          </li>
        ))}
        <li className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-3 rounded-sm border border-dashed border-slate-500" />
          Restringida
        </li>
      </ul>
    </div>
  );
}
