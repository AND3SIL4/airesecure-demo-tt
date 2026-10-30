import { ApiError } from '../infrastructure/http';

function firstFieldMessage(details: Record<string, unknown>): string | null {
  const fields = details.fields;
  if (!Array.isArray(fields)) return null;
  for (const item of fields as unknown[]) {
    if (typeof item === 'object' && item !== null) {
      const message = (item as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) return message.trim();
    }
  }
  return null;
}

/** Mensaje para el toast de error: en `VALIDACION` muestra el primer campo inválido. */
export function errorToastMessage(error: Error): string {
  if (error instanceof ApiError && error.code === 'VALIDACION') {
    const fieldMessage = firstFieldMessage(error.details);
    if (fieldMessage) return `Hay campos inválidos: ${fieldMessage}`;
  }
  return error.message;
}
