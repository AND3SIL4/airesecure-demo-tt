import { CircleCheck, CircleX, Info, X, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { dismissToast, useToastList, type Toast, type ToastKind } from '../../application/stores/toasts';

const KIND_STYLES: Record<ToastKind, { icon: LucideIcon; className: string; iconClass: string }> = {
  success: { icon: CircleCheck, className: 'border-ok/40', iconClass: 'text-ok-text' },
  error: { icon: CircleX, className: 'border-sev-critica/40', iconClass: 'text-sev-critica-text' },
  info: { icon: Info, className: 'border-brand-600/30', iconClass: 'text-brand-700' },
};

function ToastItem({ toast }: { toast: Toast }) {
  const style = KIND_STYLES[toast.kind];
  const Icon = style.icon;
  return (
    <li
      className={`pointer-events-auto flex w-80 items-start gap-3 rounded-lg border bg-surface p-3 text-sm shadow-lg ${style.className}`}
    >
      <Icon aria-hidden="true" className={`mt-0.5 size-5 shrink-0 ${style.iconClass}`} />
      <div className="flex-1 text-slate-800">
        <p>{toast.message}</p>
        {toast.action && (
          <Link
            to={toast.action.to}
            onClick={() => dismissToast(toast.id)}
            className="mt-1 inline-block font-medium text-brand-700 underline"
          >
            {toast.action.label}
          </Link>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismissToast(toast.id)}
        className="rounded p-0.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        aria-label="Cerrar notificación"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </li>
  );
}

/** Toasts abajo a la derecha: región polite para éxito e info, assertive para los errores. */
export function Toaster() {
  const toasts = useToastList();
  const polite = toasts.filter((t) => t.kind !== 'error');
  const assertive = toasts.filter((t) => t.kind === 'error');

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex flex-col items-end gap-2">
      <ol aria-live="assertive" aria-relevant="additions" aria-label="Errores" className="flex flex-col gap-2">
        {assertive.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </ol>
      <ol aria-live="polite" aria-relevant="additions" aria-label="Notificaciones" className="flex flex-col gap-2">
        {polite.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </ol>
    </div>
  );
}
