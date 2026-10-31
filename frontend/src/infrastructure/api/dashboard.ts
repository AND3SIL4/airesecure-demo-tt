// Resumen operativo (specs/005-resumen/contracts/api-dashboard.md). Sin estado, sobre http.ts.
import type { DashboardSummary } from '../../domain/types';
import { http } from '../http';

export function getDashboardSummary() {
  return http.get<DashboardSummary>('/dashboard/summary');
}
