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
