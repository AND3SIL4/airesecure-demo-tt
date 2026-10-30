import { Outlet } from 'react-router-dom';
import { DemoBanner } from './DemoBanner';
import { SkipLink } from './SkipLink';

/** Layout mínimo para las rutas sin perfil (login y no encontrado): solo el banner de demo. */
export function PublicLayout() {
  return (
    <div className="min-h-screen bg-surface-muted">
      <SkipLink />
      <DemoBanner />
      <main id="contenido" tabIndex={-1} className="flex min-h-screen flex-col pt-8 focus:outline-none">
        <Outlet />
      </main>
    </div>
  );
}
