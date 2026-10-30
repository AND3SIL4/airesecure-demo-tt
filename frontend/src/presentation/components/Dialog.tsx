import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Contenido descriptivo; se asocia con aria-describedby. */
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** Elemento que recibe el foco al abrir (por defecto, el primero enfocable). */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Impide cerrar con Esc o con el botón de cierre (p. ej., mientras hay una acción en curso). */
  preventClose?: boolean;
  className?: string;
}

/**
 * Diálogo modal con <dialog> nativo: showModal() atrapa el foco y Esc cierra.
 * Al cerrar, devuelve el foco al elemento que lo abrió.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  initialFocusRef,
  preventClose = false,
  className = '',
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      const target = initialFocusRef?.current;
      if (target) target.focus();
    } else if (!open && dialog.open) {
      dialog.close();
      returnFocusRef.current?.focus();
      returnFocusRef.current = null;
    }
  }, [open, initialFocusRef]);

  // Si el componente se desmonta abierto, se devuelve el foco igualmente.
  useEffect(() => {
    return () => {
      returnFocusRef.current?.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        // Esc: el cierre lo controla el estado `open` del padre.
        event.preventDefault();
        if (!preventClose) onClose();
      }}
      onClick={(event) => {
        // Clic en el fondo (fuera del panel).
        if (event.target === dialogRef.current && !preventClose) onClose();
      }}
      className={`m-auto w-[min(32rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-surface p-0 text-slate-900 shadow-2xl ${className}`}
    >
      {open && (
        <div className="flex flex-col gap-4 p-6">
          <header className="flex items-start justify-between gap-4">
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={preventClose}
              aria-label="Cerrar"
              className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </header>
          {description && (
            <div id={descriptionId} className="text-sm text-slate-600">
              {description}
            </div>
          )}
          {children}
          {footer && <footer className="flex flex-wrap justify-end gap-2 pt-2">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}
