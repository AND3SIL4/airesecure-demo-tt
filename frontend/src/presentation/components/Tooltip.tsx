import { cloneElement, useId, useState, type FocusEvent, type KeyboardEvent, type ReactElement } from 'react';

type TriggerProps = {
  'aria-describedby'?: string;
  onFocus?: (event: FocusEvent<HTMLElement>) => void;
  onBlur?: (event: FocusEvent<HTMLElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
};

export interface TooltipProps {
  content: string;
  children: ReactElement<TriggerProps>;
  side?: 'top' | 'bottom' | 'bottom-end' | 'right';
  /** Clases extra para la burbuja (p. ej., `lg:hidden` para ocultarla en escritorio). */
  className?: string;
  /** Clases para el contenedor (por defecto `inline-flex`). */
  wrapperClassName?: string;
}

const SIDE_CLASSES: Record<NonNullable<TooltipProps['side']>, string> = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
  'bottom-end': 'top-full right-0 mt-2',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2',
};

/** Tooltip accesible: aparece con hover y foco, se cierra con Esc y se asocia con aria-describedby. */
export function Tooltip({
  content,
  children,
  side = 'bottom',
  className = '',
  wrapperClassName = 'inline-flex',
}: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const childProps = children.props;

  const trigger = cloneElement(children, {
    'aria-describedby': [childProps['aria-describedby'], id].filter(Boolean).join(' '),
    onFocus: (event: FocusEvent<HTMLElement>) => {
      childProps.onFocus?.(event);
      setOpen(true);
    },
    onBlur: (event: FocusEvent<HTMLElement>) => {
      childProps.onBlur?.(event);
      setOpen(false);
    },
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      childProps.onKeyDown?.(event);
      if (event.key === 'Escape') setOpen(false);
    },
  });

  return (
    <span className={`relative ${wrapperClassName}`} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {trigger}
      <span
        id={id}
        role="tooltip"
        className={[
          'pointer-events-none absolute z-50 w-max max-w-60 rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white shadow-lg',
          SIDE_CLASSES[side],
          open ? 'visible opacity-100' : 'invisible opacity-0',
          'transition-opacity duration-150',
          className,
        ].join(' ')}
      >
        {content}
      </span>
    </span>
  );
}
