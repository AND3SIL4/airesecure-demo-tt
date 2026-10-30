import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useReportEventOpen } from '../../application/stores/reportEvent';
import { viewTitleForPath } from '../../domain/navigation';
import { ReportEventDialog } from '../features/alerts/ReportEventDialog';
import { DemoBanner } from './DemoBanner';
import { Sidebar } from './Sidebar';
import { SkipLink } from './SkipLink';
import { Topbar } from './Topbar';

/** Shell de la aplicación (doc 09 §2): banner, sidebar, topbar y contenido. */
export function Shell() {
  const { pathname } = useLocation();
  const reportEventOpen = useReportEventOpen();

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
