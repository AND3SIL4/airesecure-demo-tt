// Reglas visuales del Mapa 3D (doc 09 §3.7 y §5.1; skill threejs-terminal-map). Funciones puras.
import { RISK_LEVEL_META, SEVERITY_META, compareSeverity } from './severity';
import type { AlertMarker, AlertSummary, RiskLevel, Severity, Zone, ZoneGeometry } from './types';

/** Losa de la Terminal 1 en metros, centrada en (0,0); +Z apunta a la plataforma. */
export const SLAB_SIZE = { w: 120, d: 80 } as const;

/** Color de cada zona por su riesgo (tokens del doc 09 §5.1; normal en gris suave). */
export const RISK_COLORS: Record<RiskLevel, string> = {
  critica: '#DC2626',
  alta: '#EA580C',
  media: '#D97706',
  baja: '#475569',
  normal: '#CBD5E1',
};

/** Color de los marcadores por severidad (mismos tokens que el riesgo). */
export const SEVERITY_COLORS: Record<Severity, string> = {
  critica: RISK_COLORS.critica,
  alta: RISK_COLORS.alta,
  media: RISK_COLORS.media,
  baja: RISK_COLORS.baja,
};

/** Colores de apoyo de la escena (losa, bordes y selección). */
export const SCENE_COLORS = {
  slab: '#E2E8F0',
  edge: '#64748B',
  restrictedEdge: '#0B1B33',
  selected: '#1D5FD1',
} as const;

/** Texto del nivel de riesgo para las etiquetas: "Riesgo: Alto"… (nunca solo color). */
export function riskLabel(level: RiskLevel): string {
  return `Riesgo: ${RISK_LEVEL_META[level].label}`;
}

export function severityLabel(severity: Severity): string {
  return `Severidad ${SEVERITY_META[severity].label.toLowerCase()}`;
}

/** Marcador de una alerta activa en la escena (incluye el tipo para la ayuda emergente). */
export interface MapAlertMarker extends AlertMarker {
  typeName: string;
}

export interface MarkerSlot {
  /** Centro del marcador en metros (coordenadas de la losa). */
  x: number;
  z: number;
  /** Escala del pin (< 1 cuando hay muchos en la zona). */
  scale: number;
}

/**
 * Distribuye `count` marcadores en una cuadrícula centrada dentro del bloque de la zona,
 * sin salirse de él (spec: casos límite). Las columnas siguen la proporción del bloque.
 */
export function layoutMarkers(geometry: ZoneGeometry, count: number): MarkerSlot[] {
  if (count <= 0) return [];
  const { x, z, w, d } = geometry;
  const cols = Math.max(1, Math.ceil(Math.sqrt((count * w) / Math.max(d, 1))));
  const rows = Math.ceil(count / cols);
  const stepX = w / (cols + 1);
  const stepZ = d / (rows + 1);
  const scale = Math.min(1, Math.max(0.45, Math.min(stepX, stepZ) / 3));
  return Array.from({ length: count }, (_, i) => ({
    x: x - w / 2 + stepX * ((i % cols) + 1),
    z: z - d / 2 + stepZ * (Math.floor(i / cols) + 1),
    scale,
  }));
}

export type CameraPreset = 'superior' | 'isometrica' | 'reiniciar';

export interface CameraPose {
  position: readonly [number, number, number];
  target: readonly [number, number, number];
}

/** Presets de cámara (skill threejs-terminal-map). "Reiniciar" vuelve a la vista inicial (isométrica). */
export const CAMERA_POSES: Record<CameraPreset, CameraPose> = {
  isometrica: { position: [60, 70, 60], target: [0, 0, 0] },
  superior: { position: [0, 120, 0.01], target: [0, 0, 0] },
  reiniciar: { position: [60, 70, 60], target: [0, 0, 0] },
};

export const CAMERA_PRESET_LABELS: Record<CameraPreset, string> = {
  superior: 'Vista superior',
  isometrica: 'Vista isométrica',
  reiniciar: 'Reiniciar cámara',
};

/** Límites de la cámara orbital: no atraviesa el suelo ni se aleja demasiado. */
export const CAMERA_LIMITS = {
  minDistance: 40,
  maxDistance: 220,
  maxPolarAngle: Math.PI / 2.2,
} as const;

/** Desplazamiento máximo (px) entre pulsar y soltar para que cuente como clic y no como arrastre. */
export const CLICK_TOLERANCE_PX = 4;

/** "1 alerta", "3 alertas", "Sin alertas". */
export function alertCountLabel(count: number): string {
  if (count === 0) return 'Sin alertas';
  return count === 1 ? '1 alerta' : `${count} alertas`;
}

/** Zonas de mayor a menor riesgo (y más alertas primero) para que la más urgente se vea de inmediato. */
export function sortZonesByRisk(zones: readonly Zone[]): Zone[] {
  return [...zones].sort(
    (a, b) =>
      RISK_LEVEL_META[b.riskLevel].order - RISK_LEVEL_META[a.riskLevel].order ||
      b.activeAlerts - a.activeAlerts ||
      a.name.localeCompare(b.name, 'es'),
  );
}

/** Alertas activas de una zona, de mayor a menor severidad y las más recientes primero. */
export function alertsForZone(alerts: readonly AlertSummary[], zoneId: string): AlertSummary[] {
  return alerts
    .filter((a) => a.zone.id === zoneId)
    .sort((a, b) => compareSeverity(a.severity, b.severity) || b.detectedAt.localeCompare(a.detectedAt));
}

/** Marcadores de la escena a partir de las alertas activas (orden estable por id). */
export function toMapMarkers(alerts: readonly AlertSummary[]): MapAlertMarker[] {
  return alerts
    .map((a) => ({ id: a.id, zoneId: a.zone.id, severity: a.severity, typeName: a.type.name }))
    .sort((a, b) => a.id.localeCompare(b.id));
}
