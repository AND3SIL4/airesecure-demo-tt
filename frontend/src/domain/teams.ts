// Presentación de los equipos de respuesta (doc 09 §3.6).
import type { Team } from './types';

/** Texto de la opción de un selector: los equipos especializados quedan marcados. */
export function teamOptionLabel(team: Team): string {
  return team.specialized ? `${team.name} · especializado` : team.name;
}
