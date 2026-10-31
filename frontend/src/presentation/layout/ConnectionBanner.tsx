import { WifiOff } from 'lucide-react';

/**
 * Aviso bajo la Topbar mientras la conexión en vivo está caída (más de 3 s).
 * La región `role="status"` permanece montada y vacía para que los lectores de pantalla anuncien el cambio.
 */
export function ConnectionBanner({ visible }: { visible: boolean }) {
  return (
    <div role="status" className={visible ? 'sticky top-24 z-20' : 'sr-only'}>
      {visible && (
        <div className="flex items-center gap-2 border-b border-demo-fg/30 bg-demo-bg px-4 py-2 text-sm font-medium text-demo-fg lg:px-6">
          <WifiOff aria-hidden="true" className="size-4 shrink-0" />
          Conexión en vivo perdida. Reintentando…
        </div>
      )}
    </div>
  );
}
