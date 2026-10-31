import type { KeyboardEvent } from 'react';
import { RISK_LEVEL_META, SEVERITY_META } from '../../domain/severity';
import type { AlertMarker, RiskLevel, Severity, Zone } from '../../domain/types';

export interface MiniMap2DProps {
  zones: readonly Zone[];
  /** Zona a resaltar (borde grueso y nombre). */
  highlightZoneId?: string;
  /** Un punto por alerta activa, con el color de su severidad, distribuido dentro de su zona. */
  markers?: readonly AlertMarker[];
  /** Si se indica, las zonas son enfocables y se activan con clic, Enter o Espacio. */
  onZoneClick?: (zone: Zone) => void;
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

const MARKER_FILL: Record<Severity, string> = {
  critica: 'fill-sev-critica',
  alta: 'fill-sev-alta',
  media: 'fill-sev-media',
  baja: 'fill-sev-baja',
};

const MARKER_SWATCH: Record<Severity, string> = {
  critica: 'bg-sev-critica',
  alta: 'bg-sev-alta',
  media: 'bg-sev-media',
  baja: 'bg-sev-baja',
};

const LEGEND_ORDER: readonly RiskLevel[] = ['critica', 'alta', 'media', 'baja', 'normal'];
const MARKER_LEGEND_ORDER: readonly Severity[] = ['critica', 'alta', 'media', 'baja'];
const MARKER_RADIUS = 1.6;

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

/** Posiciones en rejilla, centradas dentro del rectángulo de la zona. */
function markerPositions(count: number, rect: { x: number; y: number; w: number; h: number }) {
  if (count === 0) return [];
  const cols = Math.max(1, Math.ceil(Math.sqrt((count * rect.w) / Math.max(rect.h, 1))));
  const rows = Math.ceil(count / cols);
  const stepX = rect.w / (cols + 1);
  const stepY = rect.h / (rows + 1);
  return Array.from({ length: count }, (_, i) => ({
    cx: rect.x + stepX * ((i % cols) + 1),
    cy: rect.y + stepY * (Math.floor(i / cols) + 1),
  }));
}

function riskText(level: RiskLevel): string {
  return RISK_LEVEL_META[level].label.toLowerCase();
}

function zoneAccessibleName(zone: Zone): string {
  const alerts = zone.activeAlerts === 1 ? '1 alerta activa' : `${zone.activeAlerts} alertas activas`;
  return `${zone.name}: riesgo ${riskText(zone.riskLevel)}, ${alerts}. Ver sus alertas`;
}

/** Plano 2D de la terminal (research R10): zonas coloreadas por riesgo, marcadores por severidad y la zona resaltada. */
export function MiniMap2D({ zones, highlightZoneId, markers = [], onZoneClick, className = '' }: MiniMap2DProps) {
  const highlighted = zones.find((z) => z.id === highlightZoneId);
  const withAlerts = zones.filter((z) => z.activeAlerts > 0).length;
  const interactive = onZoneClick !== undefined;
  const ariaLabel = [
    'Plano de la Terminal 1.',
    highlighted ? `Zona resaltada: ${highlighted.name}, riesgo ${riskText(highlighted.riskLevel)}.` : '',
    `${withAlerts} de ${zones.length} zonas con alertas activas.`,
    markers.length > 0 ? `${markers.length} marcadores de alertas activas.` : '',
    interactive ? 'Selecciona una zona para ver sus alertas.' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const hl = highlighted ? toSvgRect(highlighted) : null;
  const labelFontSize = highlighted && hl ? insideLabelFontSize(highlighted.name, hl) : null;

  const markersByZone = new Map<string, AlertMarker[]>();
  for (const marker of markers) {
    const list = markersByZone.get(marker.zoneId);
    if (list) list.push(marker);
    else markersByZone.set(marker.zoneId, [marker]);
  }
  const presentSeverities = MARKER_LEGEND_ORDER.filter((s) => markers.some((m) => m.severity === s));

  const handleKeyDown = (zone: Zone) => (event: KeyboardEvent<SVGGElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onZoneClick?.(zone);
    }
  };

  return (
    <div className={className}>
      <svg
        role={interactive ? 'group' : 'img'}
        aria-label={ariaLabel}
        viewBox={`0 0 ${SLAB_W} ${SLAB_D}`}
        className="h-auto w-full rounded-md border border-slate-200 bg-surface-muted"
      >
        <rect x={0.5} y={0.5} width={SLAB_W - 1} height={SLAB_D - 1} rx={2} className="fill-slate-100 stroke-slate-300" strokeWidth={0.4} />
        {zones.map((zone) => {
          const r = toSvgRect(zone);
          const isHl = zone.id === highlightZoneId;
          const rect = (
            <rect
              x={r.x}
              y={r.y}
              width={r.w}
              height={r.h}
              rx={1}
              className={`${RISK_FILL[zone.riskLevel]} ${isHl ? 'stroke-navy-950' : 'stroke-slate-400'} ${
                interactive
                  ? 'transition-colors duration-200 group-hover:stroke-brand-600 group-focus-visible:stroke-brand-600 group-focus-visible:[stroke-width:1.2]'
                  : ''
              }`}
              strokeWidth={isHl ? 1.2 : 0.35}
              strokeDasharray={zone.restricted && !isHl ? '1.5 1' : undefined}
            />
          );
          const zoneMarkers = markersByZone.get(zone.id) ?? [];
          const positions = markerPositions(zoneMarkers.length, r);
          const dots = zoneMarkers.map((marker, i) => (
            <circle
              key={marker.id}
              cx={positions[i]?.cx ?? r.x + r.w / 2}
              cy={positions[i]?.cy ?? r.y + r.h / 2}
              r={MARKER_RADIUS}
              className={`${MARKER_FILL[marker.severity]} stroke-white ${
                marker.severity === 'critica' ? 'motion-safe:animate-pulse' : ''
              }`}
              strokeWidth={0.5}
            >
              <title>{`${marker.id} · severidad ${SEVERITY_META[marker.severity].label.toLowerCase()} · ${zone.name}`}</title>
            </circle>
          ));
          if (!interactive) {
            return (
              <g key={zone.id}>
                {rect}
                {dots}
              </g>
            );
          }
          return (
            <g
              key={zone.id}
              role="button"
              tabIndex={0}
              aria-label={zoneAccessibleName(zone)}
              onClick={() => onZoneClick(zone)}
              onKeyDown={handleKeyDown(zone)}
              className="group cursor-pointer"
            >
              <title>{`${zone.name} · riesgo ${riskText(zone.riskLevel)}`}</title>
              {rect}
              {dots}
            </g>
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
      {presentSeverities.length > 0 && (
        <ul aria-label="Leyenda de marcadores" className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
          {presentSeverities.map((severity) => (
            <li key={severity} className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className={`size-2.5 rounded-full ring-1 ring-white ${MARKER_SWATCH[severity]}`} />
              Alerta {SEVERITY_META[severity].label.toLowerCase()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
