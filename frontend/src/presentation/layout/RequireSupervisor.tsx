import { useEffect, useRef } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useCurrentUser } from '../../application/hooks/useCurrentUser';
import { toast } from '../../application/stores/toasts';

const SUPERVISOR_ONLY_MESSAGE = 'Esta sección es solo para supervisores.';

/** Rutas solo para supervisor: un operador vuelve al Resumen con un aviso. */
export function RequireSupervisor() {
  const { user } = useCurrentUser();
  const isSupervisor = user?.role === 'supervisor';
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (!isSupervisor && !notifiedRef.current) {
      notifiedRef.current = true;
      toast.info(SUPERVISOR_ONLY_MESSAGE);
    }
  }, [isSupervisor]);

  if (!isSupervisor) return <Navigate to="/" replace />;
  return <Outlet />;
}
