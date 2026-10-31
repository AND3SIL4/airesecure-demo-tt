// Tipos del dominio y DTOs de la API (contracts/api-catalogs.md, doc 08 §2).
// Esta capa no importa nada del proyecto.

export type Role = 'operador' | 'supervisor';

export type Severity = 'critica' | 'alta' | 'media' | 'baja';

export type RiskLevel = Severity | 'normal';

export type AlertStatus = 'nueva' | 'en_revision' | 'confirmada' | 'descartada';

export type IncidentStatus = 'abierto' | 'en_atencion' | 'escalado' | 'resuelto';

export type DismissReasonCode =
  | 'pertenencia_personal'
  | 'movimiento_normal'
  | 'falla_camara'
  | 'personal_autorizado'
  | 'otro';

export interface User {
  id: string;
  alias: string;
  role: Role;
}

export interface ZoneGeometry {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
}

export interface Zone {
  id: string;
  name: string;
  terminal: string;
  criticality: number;
  restricted: boolean;
  geometry: ZoneGeometry;
  riskLevel: RiskLevel;
  activeAlerts: number;
}

export interface Team {
  id: string;
  name: string;
  specialty: string;
  specialized: boolean;
}

export interface AlertType {
  code: string;
  name: string;
  defaultSeverity: Severity | null;
  confidenceThreshold: number | null;
  scenarioWeight: number;
  recommendation: string;
  protocol: string[];
}

export interface DismissReason {
  code: DismissReasonCode;
  label: string;
  requiresText?: boolean;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  };
}

export const ROLE_LABELS: Record<Role, string> = {
  operador: 'Operador',
  supervisor: 'Supervisor',
};

// ---------------------------------------------------------------------------
// Alertas (specs/002-alertas/contracts/api-alerts.md, doc 08 §2)
// ---------------------------------------------------------------------------

export type SourceKind = 'camara' | 'sensor' | 'reporte_manual' | 'analisis';

export type AlertOrigin = 'seed' | 'simulador' | 'escenario' | 'manual';

export type AlertActionName = 'review' | 'confirm' | 'dismiss' | 'comment';

export type TimelineAction =
  | 'created'
  | 'review'
  | 'confirm'
  | 'dismiss'
  | 'comment'
  | 'incident_created'
  | 'assign'
  | 'start'
  | 'escalate'
  | 'resolve'
  | 'demo_reset'
  | 'scenario_triggered'
  | 'settings_updated';

export interface UserRef {
  id: string;
  alias: string;
}

export interface AlertTypeRef {
  code: string;
  name: string;
}

export interface ZoneRef {
  id: string;
  name: string;
}

export interface SourceRef {
  id: string;
  kind: SourceKind;
  label: string;
}

/** Fuente del catálogo `GET /sources` (las lógicas no tienen zona). */
export interface Source extends SourceRef {
  zoneId: string | null;
}

export interface AlertSummary {
  id: string;
  type: AlertTypeRef;
  severity: Severity;
  status: AlertStatus;
  zone: ZoneRef;
  source: SourceRef;
  /** ISO 8601 en UTC. */
  detectedAt: string;
  /** 0..1; null en los reportes manuales. */
  confidence: number | null;
  /** 0..100. */
  score: number;
  description: string;
  incidentId: string | null;
}

export interface ScoreBreakdown {
  severityWeight: number;
  confidence: number;
  zoneFactor: number;
  zoneCriticality: number;
  score: number;
  manual: boolean;
}

export interface TimelineEvent {
  id: number;
  action: TimelineAction;
  /** null = Sistema. */
  actor: UserRef | null;
  fromStatus: AlertStatus | IncidentStatus | null;
  toStatus: AlertStatus | IncidentStatus | null;
  comment: string | null;
  payload: Record<string, unknown> | null;
  createdAt: string;
}

export interface AlertDetail extends AlertSummary {
  scoreBreakdown: ScoreBreakdown;
  recommendation: string;
  protocol: string[];
  evidenceUrl: string;
  evidenceIsIllustrative: boolean;
  origin: AlertOrigin;
  dismissReason: DismissReasonCode | null;
  dismissReasonLabel: string | null;
  dismissComment: string | null;
  reviewedBy: UserRef | null;
  reportedBy: UserRef | null;
  firstActionAt: string | null;
  closedAt: string | null;
  timeline: TimelineEvent[];
}

export interface IncidentRef {
  id: string;
  status: IncidentStatus;
  alertId: string;
  openedAt: string;
}

/** Respuesta 201 de `confirm`. */
export interface ConfirmAlertResult {
  alert: AlertDetail;
  incident: IncidentRef;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type AlertActionBody =
  | { action: 'review' }
  | { action: 'confirm'; note?: string }
  | { action: 'dismiss'; reason: DismissReasonCode; comment?: string }
  | { action: 'comment'; comment: string };

export interface ManualAlertBody {
  typeCode: string;
  zoneId: string;
  severity: Severity;
  description: string;
}

export const SOURCE_KIND_LABELS: Record<SourceKind, string> = {
  camara: 'Cámara',
  sensor: 'Sensor de acceso',
  reporte_manual: 'Reporte de operador',
  analisis: 'Análisis de patrones',
};

/** Límites de texto compartidos con el backend (contracts/api-alerts.md). */
export const TEXT_LIMITS = {
  descriptionMin: 10,
  descriptionMax: 500,
  noteMax: 500,
  commentMin: 3,
  commentMax: 500,
  dismissOtherMin: 10,
} as const;

// ---------------------------------------------------------------------------
// Incidentes (specs/004-incidentes/contracts/api-incidents.md, doc 08 §2)
// ---------------------------------------------------------------------------

export type IncidentActionName = 'assign' | 'start' | 'escalate' | 'resolve' | 'comment';

export interface TeamRef {
  id: string;
  name: string;
}

export interface Incident {
  id: string;
  status: IncidentStatus;
  alert: AlertSummary;
  team: TeamRef | null;
  escalatedTo: TeamRef | null;
  openedBy: UserRef | null;
  /** ISO 8601 en UTC. */
  openedAt: string;
  startedAt: string | null;
  escalatedAt: string | null;
  resolvedAt: string | null;
  resolutionNote: string | null;
  /** Segundos desde la detección hasta la primera acción humana. */
  responseSeconds: number | null;
  /** Segundos desde la detección hasta la resolución. */
  resolutionSeconds: number | null;
}

/** Detalle con la historia combinada (alerta + incidente) en orden ascendente. */
export interface IncidentDetail extends Incident {
  timeline: TimelineEvent[];
}

export type IncidentPage = Page<Incident>;

export type IncidentActionBody =
  | { action: 'assign'; teamId: string; comment?: string }
  | { action: 'start' }
  | { action: 'escalate'; teamId: string; reason: string }
  | { action: 'resolve'; note: string }
  | { action: 'comment'; comment: string };

/** Límites de texto de las acciones de incidente (data-model.md). */
export const INCIDENT_TEXT_LIMITS = {
  reasonMin: 10,
  reasonMax: 500,
  resolutionNoteMin: 10,
  resolutionNoteMax: 500,
} as const;

// ---------------------------------------------------------------------------
// Resumen (specs/005-resumen/contracts/api-dashboard.md, doc 08 §3.2)
// ---------------------------------------------------------------------------

export interface DashboardKpis {
  activeAlerts: number;
  criticalAlerts: number;
  openIncidents: number;
  resolvedToday: number;
  /** null si hoy no hay incidentes con primera acción. */
  avgResponseSecondsToday: number | null;
}

export type KpiKey = keyof DashboardKpis;

/**
 * Variación frente a ayer (de 00:00 a la misma hora).
 * `pct`: porcentaje; `abs`: ayer = 0 y hoy > 0 (diferencia absoluta); `none`: sin datos de ayer.
 */
export type Delta =
  | { kind: 'pct'; value: number | null; previous: number | null; pct: number }
  | { kind: 'abs'; value: number | null; previous: number | null; diff: number }
  | { kind: 'none'; value: number | null; previous: number | null };

export interface ZoneStatus {
  id: string;
  name: string;
  riskLevel: RiskLevel;
  activeAlerts: number;
}

export interface AlertMarker {
  id: string;
  zoneId: string;
  severity: Severity;
}

export interface CategoryCount {
  typeCode: string;
  typeName: string;
  count: number;
}

export interface HourlyCount {
  /** ISO 8601 con offset de Bogotá (inicio de la hora). */
  hour: string;
  count: number;
}

export type AnomalyScope = 'zone' | 'type';

export interface Anomaly {
  scope: AnomalyScope;
  key: string;
  label: string;
  lastHour: number;
  /** Media horaria de referencia (mínimo 1,0). */
  hourlyMean: number;
  variationPct: number;
}

export interface DashboardSummary {
  generatedAt: string;
  kpis: DashboardKpis;
  deltas: Record<KpiKey, Delta>;
  topAlerts: AlertSummary[];
  zones: ZoneStatus[];
  activeAlertMarkers: AlertMarker[];
  byCategory7d: CategoryCount[];
  trend24h: HourlyCount[];
  anomalies: Anomaly[];
}

// ---------------------------------------------------------------------------
// Análisis (specs/007-analisis-reportes/contracts/api-analytics.md, doc 08 §3.5)
// ---------------------------------------------------------------------------

export interface ZoneCount {
  zoneId: string;
  zoneName: string;
  count: number;
}

/** Incidentes por día (fecha de Bogotá `YYYY-MM-DD`) con el desglose por severidad. */
export interface DailySeverityCount {
  date: string;
  total: number;
  critica: number;
  alta: number;
  media: number;
  baja: number;
}

export interface DailyTimes {
  date: string;
  avgResponseSeconds: number | null;
  avgResolutionSeconds: number | null;
}

export interface AnalyticsTimes {
  avgResponseSeconds: number | null;
  avgResolutionSeconds: number | null;
  byDay: DailyTimes[];
}

export interface AlertOutcomes {
  confirmed: number;
  dismissed: number;
  /** 0..1; null si no hay alertas decididas en el rango. */
  confirmationRate: number | null;
  /** Acumulado desde la siembra (no depende del rango). */
  belowThreshold: number;
}
