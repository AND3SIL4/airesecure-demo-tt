import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { User } from '../../domain/types';
import { getMe } from '../../infrastructure/api/catalog';
import { ApiError } from '../../infrastructure/http';
import { queryKeys } from '../queryKeys';
import { clearActor, useActorId } from '../stores/actor';

/** Código de la API cuando `X-Actor-Id` falta o no corresponde a un perfil (doc 08). */
const ACTOR_REQUIRED_CODE = 'ACTOR_REQUERIDO';

export type CurrentUserStatus =
  /** No hay perfil guardado. */
  | 'anonymous'
  /** Hay perfil guardado y se está validando con `GET /me`. */
  | 'loading'
  /** No se pudo validar el perfil (red u otro error de la API). */
  | 'error'
  /** La API rechazó el perfil guardado (se borra). */
  | 'invalid'
  /** Perfil válido. */
  | 'ready';

export interface CurrentUserResult {
  user: User | null;
  status: CurrentUserStatus;
  /** Mensaje del error al validar el perfil (status = 'error'). */
  errorMessage: string | null;
  retry: () => void;
}

function isActorRequired(error: unknown): boolean {
  return error instanceof ApiError && error.code === ACTOR_REQUIRED_CODE;
}

/** Valida el perfil persistido contra `GET /me`. */
export function useCurrentUser(): CurrentUserResult {
  const actorId = useActorId();
  const me = useQuery({
    queryKey: queryKeys.me(actorId),
    queryFn: getMe,
    enabled: !!actorId,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => !isActorRequired(error) && failureCount < 1,
  });

  const isInvalid = Boolean(actorId) && me.isError && isActorRequired(me.error);

  useEffect(() => {
    if (isInvalid) clearActor();
  }, [isInvalid]);

  const user = actorId && me.data ? me.data : null;

  let status: CurrentUserStatus;
  if (!actorId) status = 'anonymous';
  else if (isInvalid) status = 'invalid';
  else if (user) status = 'ready';
  else if (me.isError) status = 'error';
  else status = 'loading';

  return {
    user,
    status,
    errorMessage: status === 'error' && me.error ? me.error.message : null,
    retry: () => {
      void me.refetch();
    },
  };
}
