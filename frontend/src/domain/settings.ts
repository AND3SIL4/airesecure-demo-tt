// Reglas y textos de la vista Configuración (specs/008-configuracion-demo, plan R1 y R6).
// Esta capa no importa nada fuera de domain.
import type { ResetResult, SettingsUpdate, SimulatorSettings } from './types';

export const INTERVAL_RANGE = { min: 15, max: 300, sliderStep: 5 } as const;
export const THRESHOLD_RANGE = { min: 0.5, max: 0.99, step: 0.01 } as const;

/** Palabra que hay que escribir exactamente para reiniciar la demo. */
export const RESET_CONFIRMATION_WORD = 'REINICIAR';

export type ParseResult = { ok: true; value: number } | { ok: false; error: string };

function parseDecimal(raw: string): number | null {
  const text = raw.trim().replace(',', '.');
  if (text === '' || !/^-?\d*(\.\d*)?$/.test(text)) return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

/** Intervalo del simulador: entero de 15 a 300 s. */
export function validateInterval(raw: string): ParseResult {
  const value = parseDecimal(raw);
  if (value === null || !Number.isInteger(value) || value < INTERVAL_RANGE.min || value > INTERVAL_RANGE.max) {
    return {
      ok: false,
      error: `El intervalo debe ser un número entero entre ${INTERVAL_RANGE.min} y ${INTERVAL_RANGE.max} segundos.`,
    };
  }
  return { ok: true, value };
}

/** Umbral de confianza: de 0,50 a 0,99 con dos decimales como máximo. */
export function validateThreshold(raw: string): ParseResult {
  const value = parseDecimal(raw);
  const error = 'El umbral debe estar entre 0,50 y 0,99 (dos decimales).';
  if (value === null || value < THRESHOLD_RANGE.min || value > THRESHOLD_RANGE.max) return { ok: false, error };
  if (Math.abs(value * 100 - Math.round(value * 100)) > 1e-9) return { ok: false, error };
  return { ok: true, value: Math.round(value * 100) / 100 };
}

/** Valor del input de umbral (el input numérico usa punto decimal). */
export function thresholdInputValue(value: number): string {
  return value.toFixed(2);
}

/** Umbral legible en es-CO: `0,80`. */
export function formatThreshold(value: number): string {
  return value.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export interface ThresholdDiff {
  /** Solo los tipos cuyo valor válido difiere del guardado. */
  changes: Record<string, number>;
  /** Errores por código de tipo. */
  errors: Record<string, string>;
}

/** Compara los borradores con los valores guardados y valida cada uno. */
export function diffThresholds(drafts: Record<string, string>, saved: Record<string, number>): ThresholdDiff {
  const changes: Record<string, number> = {};
  const errors: Record<string, string> = {};
  for (const [code, raw] of Object.entries(drafts)) {
    const result = validateThreshold(raw);
    if (!result.ok) {
      errors[code] = result.error;
    } else if (saved[code] === undefined || Math.abs(result.value - saved[code]) > 1e-9) {
      changes[code] = result.value;
    }
  }
  return { changes, errors };
}

/** Segundos que faltan hasta `iso` (redondeo hacia arriba, nunca negativos). */
export function secondsUntil(iso: string, nowMs: number): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - nowMs) / 1000));
}

export type SimulatorTone = 'running' | 'stopped';

export interface SimulatorStatus {
  tone: SimulatorTone;
  label: string;
}

/** Estado legible del simulador: "Simulador detenido" o "Próximo evento en ~N s". */
export function simulatorStatus(simulator: SimulatorSettings, nowMs: number): SimulatorStatus {
  if (!simulator.enabled || !simulator.running) return { tone: 'stopped', label: 'Simulador detenido' };
  if (!simulator.nextRunAt) return { tone: 'running', label: 'Simulador en ejecución' };
  const seconds = secondsUntil(simulator.nextRunAt, nowMs);
  return {
    tone: 'running',
    label: seconds === 0 ? 'Próximo evento en unos instantes' : `Próximo evento en ~${seconds} s`,
  };
}

/** Mensaje del toast de éxito según lo que se guardó. */
export function settingsUpdatedMessage(update: SettingsUpdate): string {
  const simulator = update.simulator;
  if (simulator?.enabled !== undefined && simulator.intervalSeconds === undefined && !update.thresholds) {
    return simulator.enabled ? 'Simulador encendido' : 'Simulador apagado';
  }
  if (simulator?.intervalSeconds !== undefined && !update.thresholds) {
    return `Intervalo actualizado a ${simulator.intervalSeconds} s`;
  }
  if (update.thresholds && !simulator) {
    const count = Object.keys(update.thresholds).length;
    return count === 1 ? 'Umbral actualizado' : `${count} umbrales actualizados`;
  }
  return 'Configuración guardada';
}

export function scenarioTriggeredMessage(scenarioId: string, alertId: string): string {
  return `Escenario ${scenarioId} disparado: ${alertId}`;
}

export function resetSuccessMessage(result: ResetResult): string {
  return `Demo reiniciada: ${result.alerts} alertas y ${result.incidents} incidentes generados`;
}
