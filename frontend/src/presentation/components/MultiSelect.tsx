import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

export interface MultiSelectOption {
  value: string;
  /** Texto accesible y de búsqueda. */
  label: string;
  /** Contenido visual opcional (p. ej., un badge con texto); si falta, se muestra `label`. */
  content?: ReactNode;
}

export interface MultiSelectProps {
  label: string;
  options: readonly MultiSelectOption[];
  selected: readonly string[];
  onChange: (values: string[]) => void;
  /** Texto del botón cuando no hay selección (por defecto, "Todos"). */
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Selector múltiple accesible: botón disclosure (aria-expanded) que abre un popover con
 * casillas nativas. ↑/↓ recorren las opciones, Espacio marca y Esc cierra devolviendo el foco.
 */
export function MultiSelect({
  label,
  options,
  selected,
  onChange,
  placeholder = 'Todos',
  disabled = false,
  className = '',
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLFieldSetElement>(null);
  const panelId = useId();

  // Clic fuera: cierra sin mover el foco.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // Al abrir, el foco pasa a la primera casilla.
  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLInputElement>('input')?.focus();
  }, [open]);

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  const close = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  };

  const onPanelKeyDown = (event: KeyboardEvent<HTMLFieldSetElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close(true);
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const inputs = Array.from(panelRef.current?.querySelectorAll<HTMLInputElement>('input') ?? []);
    const index = inputs.indexOf(document.activeElement as HTMLInputElement);
    const nextIndex =
      event.key === 'ArrowDown' ? Math.min(inputs.length - 1, index + 1) : Math.max(0, index - 1);
    inputs[nextIndex]?.focus();
  };

  const selectedLabels = options.filter((o) => selected.includes(o.value)).map((o) => o.label);
  const summary =
    selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length === 1
        ? selectedLabels[0]
        : `${selectedLabels.length} seleccionados`;

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onBlur={(event) => {
        // El foco sale del componente (Tab): se cierra.
        if (open && !event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className={[
          'inline-flex h-9 max-w-56 items-center gap-2 rounded-md border bg-surface px-3 text-sm',
          'transition-colors duration-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60',
          selected.length > 0 ? 'border-brand-600/60 text-slate-900' : 'border-slate-300 text-slate-700',
        ].join(' ')}
      >
        <span className="font-medium">{label}:</span>
        <span className="truncate">{summary}</span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-slate-500" />
      </button>

      {open && (
        <fieldset
          ref={panelRef}
          id={panelId}
          onKeyDown={onPanelKeyDown}
          className="absolute top-full left-0 z-40 mt-1 max-h-72 min-w-56 overflow-y-auto rounded-lg border border-slate-200 bg-surface p-1 shadow-lg"
        >
          <legend className="sr-only">{label}</legend>
          {options.length === 0 && <p className="px-3 py-2 text-sm text-slate-500">Sin opciones disponibles</p>}
          {options.map((option) => {
            const checked = selected.includes(option.value);
            return (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-800 hover:bg-slate-50 has-[:focus-visible]:bg-slate-100"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(option.value)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className={[
                    'flex size-4 shrink-0 items-center justify-center rounded border',
                    'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600 peer-focus-visible:ring-offset-1',
                    checked ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-400 bg-surface',
                  ].join(' ')}
                >
                  {checked && <Check className="size-3" />}
                </span>
                {option.content ?? <span>{option.label}</span>}
              </label>
            );
          })}
        </fieldset>
      )}
    </div>
  );
}
