// Cliente HTTP mínimo sobre fetch. Solo lo usa la capa application (vía infrastructure/api/*).
import type { ApiErrorBody } from '../domain/types';

const BASE_URL = '/api';

const NETWORK_ERROR_MESSAGE = 'No se pudo conectar con el servidor de la demo. Verifica que la API esté en ejecución.';
const UNEXPECTED_ERROR_MESSAGE = 'Ocurrió un error inesperado.';

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: Record<string, unknown>;

  constructor(code: string, message: string, status: number, details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

type ActorProvider = () => string | null;

let actorProvider: ActorProvider = () => null;

/** Registra la función que devuelve el perfil activo para la cabecera `X-Actor-Id`. */
export function setActorProvider(fn: ActorProvider): void {
  actorProvider = fn;
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false;
  const error = (value as { error: unknown }).error;
  return (
    typeof error === 'object' &&
    error !== null &&
    typeof (error as { code?: unknown }).code === 'string' &&
    typeof (error as { message?: unknown }).message === 'string'
  );
}

/** Cabecera `X-Actor-Id` del perfil activo (vacía si no hay perfil). */
export function actorHeaders(): Record<string, string> {
  const actorId = actorProvider();
  return actorId ? { 'X-Actor-Id': actorId } : {};
}

export const API_BASE_URL = BASE_URL;

export function networkError(status = 0): ApiError {
  return new ApiError('RED', NETWORK_ERROR_MESSAGE, status);
}

function parseJson(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Convierte una respuesta no 2xx (con su cuerpo en texto) en ApiError. */
export function errorFromResponse(status: number, text: string): ApiError {
  const payload = parseJson(text);
  if (isApiErrorBody(payload)) {
    const { code, message, details } = payload.error;
    return new ApiError(code, message, status, details ?? {});
  }
  // Sin cuerpo de error común: el proxy de Vite responde 500 vacío si la API no está arriba.
  if (status >= 500 && payload === null) return networkError(status);
  return new ApiError('ERROR_INTERNO', UNEXPECTED_ERROR_MESSAGE, status);
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json', ...actorHeaders() };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw networkError();
  }

  const text = await response.text();
  if (!response.ok) throw errorFromResponse(response.status, text);

  const payload = parseJson(text);
  if (payload === null && text) {
    // Respuesta 2xx que no es JSON (p. ej., el index.html de Vite si el proxy no responde).
    throw networkError(response.status);
  }

  return payload as T;
}

export const http = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
};
