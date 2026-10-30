import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /** Sustantivo en plural para el total, p. ej. "alertas". */
  itemsLabel: string;
  /** Sustantivo en singular para cuando el total es 1. */
  itemLabel: string;
  className?: string;
}

/** "Página X de Y · N alertas" con anterior y siguiente. */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  itemsLabel,
  itemLabel,
  className = '',
}: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pages);
  return (
    <nav aria-label="Paginación" className={`flex flex-wrap items-center justify-between gap-3 ${className}`}>
      <p className="tabular text-sm text-slate-600" aria-live="polite">
        Página {current} de {pages} · {total} {total === 1 ? itemLabel : itemsLabel}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon={ChevronLeft}
          disabled={current <= 1}
          onClick={() => onPageChange(current - 1)}
          aria-label="Página anterior"
        >
          Anterior
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={current >= pages}
          onClick={() => onPageChange(current + 1)}
          aria-label="Página siguiente"
        >
          Siguiente
          <ChevronRight aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </nav>
  );
}
