// Control de la demo: escenarios (003) y reinicio (008). Solo supervisor.
import type { AlertDetail, ResetResult, Scenario } from '../../domain/types';
import { http } from '../http';

export function getScenarios() {
  return http.get<Scenario[]>('/demo/scenarios');
}

export function triggerScenario(id: string) {
  return http.post<AlertDetail>(`/demo/scenarios/${encodeURIComponent(id)}/trigger`);
}

export function resetDemo() {
  return http.post<ResetResult>('/demo/reset');
}
