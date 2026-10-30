import { FlaskConical } from 'lucide-react';

export const DEMO_BANNER_TEXT = 'Modo demostración: detecciones simuladas, requieren validación humana';

/** Aviso permanente de modo demostración (doc 09 §2). No se puede cerrar. */
export function DemoBanner() {
  return (
    <div
      role="note"
      className="fixed inset-x-0 top-0 z-50 flex h-8 items-center justify-center gap-2 border-b border-demo-fg/20 bg-demo-bg px-4 text-xs font-medium text-demo-fg sm:text-sm"
    >
      <FlaskConical aria-hidden="true" className="size-4 shrink-0" />
      <span className="truncate" title={DEMO_BANNER_TEXT}>
        {DEMO_BANNER_TEXT}
      </span>
    </div>
  );
}
