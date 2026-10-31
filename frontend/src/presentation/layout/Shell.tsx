import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useLiveStatus } from '../../application/stores/liveStatus';
import { useReportEventOpen } from '../../application/stores/reportEvent';
import { useLiveEvents } from '../../application/useLiveEvents';
import { viewTitleForPath } from '../../domain/navigation';
import { ReportEventDialog } from '../features/alerts/ReportEventDialog';
import { ConnectionBanner } from './ConnectionBanner';
import { DemoBanner } from './DemoBanner';
import { Sidebar } from './Sidebar';
import { SkipLink } from './SkipLink';
import { Topbar } from './Topbar';

/** Shell de la aplicación (doc 09 §2): banner, sidebar, topbar y contenido. */
export function Shell() {
  const { pathname } = useLocation();
  const reportEventOpen = useReportEventOpen();
  // Suscripción única a /api/stream mientras hay un perfil activo (contracts/ui-realtime.md).
  useLiveEvents();
  const liveStatus = useLiveStatus();

  useEffect(() => {
    document.title = `${viewTitleForPath(pathname)} · AeroSecure AI · Demo`;
  }, [pathname]);

  return (
    <div className="min-h-screen bg-surface-muted">
      <SkipLink />
      <DemoBanner />
      <div className="flex pt-8">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <ConnectionBanner visible={liveStatus === 'reconnecting'} />
          <main id="contenido" tabIndex={-1} className="mx-auto w-full max-w-[1440px] flex-1 p-6 focus:outline-none">
            <Outlet />
          </main>
        </div>
      </div>
      {/* Modal global "Reportar evento" (research R11): un solo montaje, abierto desde la Topbar o /alertas. */}
      {reportEventOpen && <ReportEventDialog />}
    </div>
  );
}
