import { LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../../application/hooks/useCurrentUser';
import { clearActor } from '../../application/stores/actor';
import { navItemsForRole } from '../../domain/navigation';
import { ROLE_LABELS } from '../../domain/types';
import { NAV_ICONS } from '../components/icons';
import { Logo } from '../components/Logo';
import { Tooltip } from '../components/Tooltip';

/** Navegación lateral (240 px; 72 px con iconos por debajo de 1024 px). */
export function Sidebar() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const items = user ? navItemsForRole(user.role) : [];
  const RoleIcon = user?.role === 'supervisor' ? ShieldCheck : UserRound;

  const changeProfile = () => {
    clearActor();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="sticky top-8 flex h-[calc(100vh-2rem)] w-[72px] shrink-0 flex-col bg-navy-950 text-slate-200 lg:w-60">
      <div className="flex h-16 items-center justify-center px-4 lg:justify-start">
        <Logo tone="light" collapsible />
      </div>

      <nav aria-label="Navegación principal" className="flex-1 px-3 py-4">
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const Icon = NAV_ICONS[item.icon];
            return (
              <li key={item.path}>
                <Tooltip content={item.label} side="right" className="lg:hidden" wrapperClassName="flex w-full">
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      [
                        'flex h-10 w-full items-center justify-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-200 lg:justify-start',
                        'focus-visible:outline-offset-0',
                        isActive
                          ? 'bg-brand-600 text-white'
                          : 'text-slate-300 hover:bg-navy-900 hover:text-white',
                      ].join(' ')
                    }
                  >
                    <Icon aria-hidden="true" className="size-5 shrink-0" />
                    <span className="sr-only lg:not-sr-only lg:flex-1">{item.label}</span>
                    {/* Espacio reservado para los contadores (features 002 y 004). */}
                    <span aria-hidden="true" className="hidden lg:inline-block" />
                  </NavLink>
                </Tooltip>
              </li>
            );
          })}
        </ul>
      </nav>

      {user && (
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center justify-center gap-3 rounded-md px-1 py-2 lg:justify-start lg:bg-navy-900 lg:px-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
              <RoleIcon aria-hidden="true" className="size-5" />
            </span>
            <div className="sr-only min-w-0 lg:not-sr-only">
              <p className="truncate text-sm font-semibold text-white" title={user.alias}>
                {user.alias}
              </p>
              <p className="text-xs text-slate-300">{ROLE_LABELS[user.role]}</p>
            </div>
          </div>
          <Tooltip content="Cambiar perfil" side="right" className="lg:hidden" wrapperClassName="flex w-full">
            <button
              type="button"
              onClick={changeProfile}
              className="mt-2 flex h-9 w-full items-center justify-center gap-2 rounded-md text-sm font-medium text-slate-300 hover:bg-navy-900 hover:text-white"
            >
              <LogOut aria-hidden="true" className="size-4 shrink-0" />
              <span className="sr-only lg:not-sr-only">Cambiar perfil</span>
            </button>
          </Tooltip>
        </div>
      )}
    </aside>
  );
}
