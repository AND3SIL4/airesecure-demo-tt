// Ítems del menú lateral y títulos de vista (doc 09 §1-2).
import type { Role } from './types';

export type NavIcon =
  | 'layout-dashboard'
  | 'siren'
  | 'folder-open'
  | 'map'
  | 'chart-line'
  | 'file-text'
  | 'settings';

export interface NavItem {
  path: string;
  label: string;
  icon: NavIcon;
  supervisorOnly: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { path: '/', label: 'Resumen', icon: 'layout-dashboard', supervisorOnly: false },
  { path: '/alertas', label: 'Alertas', icon: 'siren', supervisorOnly: false },
  { path: '/incidentes', label: 'Incidentes', icon: 'folder-open', supervisorOnly: false },
  { path: '/mapa', label: 'Mapa', icon: 'map', supervisorOnly: false },
  { path: '/analisis', label: 'Análisis', icon: 'chart-line', supervisorOnly: false },
  { path: '/reportes', label: 'Reportes', icon: 'file-text', supervisorOnly: true },
  { path: '/configuracion', label: 'Configuración', icon: 'settings', supervisorOnly: true },
];

export function navItemsForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.supervisorOnly || role === 'supervisor');
}

export const VIEW_TITLES = {
  summary: 'Resumen',
  alerts: 'Alertas',
  alertDetail: 'Detalle de alerta',
  incidents: 'Incidentes',
  incidentDetail: 'Detalle de incidente',
  map: 'Mapa',
  analysis: 'Análisis',
  reports: 'Reportes',
  settings: 'Configuración',
  notFound: 'No encontrado',
} as const;

/** Título de la vista según la ruta actual (para la barra superior). */
export function viewTitleForPath(pathname: string): string {
  if (pathname === '/') return VIEW_TITLES.summary;
  if (/^\/alertas\/[^/]+$/.test(pathname)) return VIEW_TITLES.alertDetail;
  if (pathname === '/alertas') return VIEW_TITLES.alerts;
  if (/^\/incidentes\/[^/]+$/.test(pathname)) return VIEW_TITLES.incidentDetail;
  if (pathname === '/incidentes') return VIEW_TITLES.incidents;
  if (pathname === '/mapa') return VIEW_TITLES.map;
  if (pathname === '/analisis') return VIEW_TITLES.analysis;
  if (pathname === '/reportes') return VIEW_TITLES.reports;
  if (pathname === '/configuracion') return VIEW_TITLES.settings;
  return VIEW_TITLES.notFound;
}

export const AIRPORT_LABEL = 'Aeropuerto Internacional Demo · Terminal 1';
export const UPCOMING_FEATURE_MESSAGE = 'Disponible en una próxima versión';
