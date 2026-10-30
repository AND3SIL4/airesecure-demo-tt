import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../../application/hooks/useCurrentUser';
import { clearActor } from '../../application/stores/actor';
import { Button } from '../components/Button';
import { ErrorState } from '../components/ErrorState';
import { Skeleton } from '../components/Skeleton';
import { DemoBanner } from './DemoBanner';

function ShellSkeleton() {
  return (
    <div className="min-h-screen bg-surface-muted">
      <DemoBanner />
      <div className="flex pt-8">
        <div aria-hidden="true" className="h-[calc(100vh-2rem)] w-[72px] shrink-0 bg-navy-950 lg:w-60" />
        <div className="flex min-w-0 flex-1 flex-col">
          <div aria-hidden="true" className="h-16 bg-navy-900" />
          <div className="mx-auto w-full max-w-[1440px] space-y-4 p-6">
            <Skeleton variant="text" rows={2} label="Cargando tu perfil…" className="max-w-sm" />
            <Skeleton variant="card" label="Cargando contenido…" />
            <Skeleton variant="table" rows={5} label="Cargando contenido…" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Protege las rutas internas: sin perfil válido redirige a /login conservando el destino. */
export function RequireActor() {
  const location = useLocation();
  const navigate = useNavigate();
  const { status, errorMessage, retry } = useCurrentUser();

  if (status === 'anonymous' || status === 'invalid') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (status === 'loading') return <ShellSkeleton />;

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-surface-muted">
        <DemoBanner />
        <main className="mx-auto flex min-h-screen max-w-xl items-center px-6 pt-8">
          <ErrorState
            className="w-full"
            title="No se pudo validar tu perfil"
            message={errorMessage ?? 'No se pudo cargar el catálogo de perfiles.'}
            onRetry={retry}
            extraActions={
              <Button
                variant="secondary"
                onClick={() => {
                  clearActor();
                  navigate('/login', { replace: true });
                }}
              >
                Cambiar perfil
              </Button>
            }
          />
        </main>
      </div>
    );
  }

  return <Outlet />;
}
