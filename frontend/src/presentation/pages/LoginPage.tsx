import { ChevronRight, ShieldCheck, UserRound, Users } from 'lucide-react';
import { useEffect } from 'react';
import { Navigate, useLocation, type Location } from 'react-router-dom';
import { useCurrentUser } from '../../application/hooks/useCurrentUser';
import { useUsers } from '../../application/hooks/useUsers';
import { setActor } from '../../application/stores/actor';
import { toast } from '../../application/stores/toasts';
import { ROLE_LABELS, type User } from '../../domain/types';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Logo } from '../components/Logo';
import { Skeleton } from '../components/Skeleton';

function redirectTarget(state: unknown): string {
  const from = (state as { from?: Partial<Location> } | null)?.from;
  if (!from?.pathname || from.pathname === '/login') return '/';
  return `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`;
}

function ProfileCard({ user, onSelect }: { user: User; onSelect: (user: User) => void }) {
  const Icon = user.role === 'supervisor' ? ShieldCheck : UserRound;
  return (
    <button
      type="button"
      onClick={() => onSelect(user)}
      className="group flex w-full items-center gap-4 rounded-lg border border-slate-200 bg-surface p-4 text-left shadow-sm transition-colors duration-200 hover:border-brand-600 hover:bg-brand-600/5"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-navy-950 text-white">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-slate-900">{user.alias}</span>
        <span className="block text-sm text-slate-600">{ROLE_LABELS[user.role]}</span>
      </span>
      <ChevronRight aria-hidden="true" className="size-5 text-slate-400 group-hover:text-brand-700" />
    </button>
  );
}

/** Login simulado (doc 09 §3.1): se elige un perfil, sin contraseña. */
export function LoginPage() {
  const location = useLocation();
  const { status } = useCurrentUser();
  const users = useUsers();

  useEffect(() => {
    document.title = 'Selecciona tu perfil · AeroSecure AI · Demo';
  }, []);

  if (status === 'ready') {
    return <Navigate to={redirectTarget(location.state)} replace />;
  }

  const handleSelect = (user: User) => {
    setActor(user.id);
    toast.success(`Sesión iniciada como ${user.alias} (${ROLE_LABELS[user.role]}).`);
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <section
        aria-labelledby="login-title"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-surface p-8 shadow-lg"
      >
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 id="login-title" className="mt-6 text-center text-xl font-semibold text-slate-900">
          Selecciona tu perfil
        </h1>

        <div className="mt-6">
          {users.isPending && (
            <div className="space-y-3">
              <Skeleton variant="card" label="Cargando perfiles…" />
              <Skeleton variant="card" label="Cargando perfiles…" />
              <Skeleton variant="card" label="Cargando perfiles…" />
            </div>
          )}

          {users.isError && (
            <ErrorState
              title="No se pudieron cargar los perfiles"
              message={users.error.message}
              onRetry={() => void users.refetch()}
              retrying={users.isFetching}
            />
          )}

          {users.isSuccess && users.data.length === 0 && (
            <EmptyState
              icon={Users}
              title="No hay perfiles disponibles"
              message="Reinicia la demo para volver a crear los perfiles simulados."
              actionLabel="Reintentar"
              onAction={() => void users.refetch()}
            />
          )}

          {users.isSuccess && users.data.length > 0 && (
            <ul className="space-y-3">
              {users.data.map((user) => (
                <li key={user.id}>
                  <ProfileCard user={user} onSelect={handleSelect} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">Acceso simulado para la demo. No requiere contraseña.</p>
      </section>
    </div>
  );
}
