// Configuración de la demo (specs/008-configuracion-demo/contracts/api-settings.md). Solo supervisor.
import type { Settings, SettingsUpdate } from '../../domain/types';
import { http } from '../http';

export function getSettings() {
  return http.get<Settings>('/settings');
}

export function putSettings(body: SettingsUpdate) {
  return http.put<Settings>('/settings', body);
}
