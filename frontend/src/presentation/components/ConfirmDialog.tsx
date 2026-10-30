import { useRef, type ReactNode } from 'react';
import { Button } from './Button';
import { Dialog } from './Dialog';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}

/** Confirmación de acciones irreversibles. "Cancelar" recibe el foco por defecto. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  variant = 'primary',
  loading = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      initialFocusRef={cancelRef}
      preventClose={loading}
      footer={
        <>
          <Button ref={cancelRef} variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}
