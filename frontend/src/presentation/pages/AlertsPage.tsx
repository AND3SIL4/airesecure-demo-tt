import { ArrowUp, Plus, SearchX, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type FocusEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAlerts } from '../../application/hooks/useAlerts';
import { useAlertTypes, useSources, useZones } from '../../application/hooks/useCatalogs';
import { getLastArrivalSeq, useAlertArrivals } from '../../application/stores/notifications';
import { openReportEvent } from '../../application/stores/reportEvent';
import type { AlertSummary, Page } from '../../domain/types';
import {
  ALERTS_PAGE_SIZE,
  clearAlertFilters,
  hasActiveFilters,
  parseAlertFilters,
  toSearchParams,
  type AlertFilters,
} from '../../domain/alertFilters';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { FilterBar } from '../components/FilterBar';
import { Pagination } from '../components/Pagination';
import { Skeleton } from '../components/Skeleton';
import { AlertTable } from '../features/alerts/AlertTable';

const HIGHLIGHT_PARAM = 'highlight';
const HIGHLIGHT_MS = 2000;

interface FrozenList {
  /** Filtros serializados de la página congelada. */
  key: string;
  data: Page<AlertSummary>;
  /** Última llegada en vivo ya incluida en `data`. */
  seq: number;
}

/**
 * Lista en vivo (research R10): resalta 2 s las alertas recién llegadas y, mientras el foco está
 * dentro de la tabla, congela los datos mostrados y cuenta las nuevas para la píldora "Mostrar".
 */
function useLiveAlertList(key: string, live: Page<AlertSummary> | undefined, liveIsPlaceholder: boolean) {
  const arrivals = useAlertArrivals();
  const [baselineSeq] = useState(getLastArrivalSeq);
  const [focusInside, setFocusInside] = useState(false);
  const [frozen, setFrozen] = useState<FrozenList | null>(null);
  const [expired, setExpired] = useState<ReadonlySet<string>>(() => new Set());
  const timedIds = useRef(new Set<string>());
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  // Con el foco dentro, al cambiar de filtros o de página se congela la página nueva (estado derivado).
  if (focusInside && live && !liveIsPlaceholder && (!frozen || frozen.key !== key)) {
    setFrozen({ key, data: live, seq: getLastArrivalSeq() });
  }

  const isFrozen = focusInside && frozen !== null && frozen.key === key;
  const shown = isFrozen ? frozen.data : live;

  // Nuevas que ya están en los datos en vivo pero no en la página congelada.
  const pendingIds = useMemo(() => {
    if (!isFrozen || !live) return [];
    const frozenIds = new Set(frozen.data.items.map((a) => a.id));
    const liveIds = new Set(live.items.map((a) => a.id));
    const ids = arrivals
      .filter((a) => a.seq > frozen.seq && liveIds.has(a.id) && !frozenIds.has(a.id))
      .map((a) => a.id);
    return [...new Set(ids)];
  }, [arrivals, frozen, isFrozen, live]);

  // Llegadas visibles en la página mostrada que aún no han cumplido sus 2 s de resaltado.
  const highlightIds = useMemo(() => {
    const shownIds = new Set(shown?.items.map((a) => a.id) ?? []);
    return new Set(
      arrivals.filter((a) => a.seq > baselineSeq && shownIds.has(a.id) && !expired.has(a.id)).map((a) => a.id),
    );
  }, [arrivals, baselineSeq, expired, shown]);

  useEffect(() => {
    for (const id of highlightIds) {
      if (timedIds.current.has(id)) continue;
      timedIds.current.add(id);
      const timer = setTimeout(() => {
        timers.current.delete(timer);
        setExpired((prev) => new Set(prev).add(id));
      }, HIGHLIGHT_MS);
      timers.current.add(timer);
    }
  }, [highlightIds]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending) clearTimeout(timer);
    };
  }, []);

  const onFocus = () => {
    if (focusInside) return;
    setFocusInside(true);
    if (live && !liveIsPlaceholder) setFrozen({ key, data: live, seq: getLastArrivalSeq() });
  };

  const onBlur = (event: FocusEvent<HTMLElement>) => {
    const next = event.relatedTarget as Node | null;
    if (next && event.currentTarget.contains(next)) return;
    setFocusInside(false);
    setFrozen(null);
  };

  /** Descongela: muestra los datos en vivo (que se vuelven a congelar mientras siga el foco). */
  const showNew = () => {
    if (live) setFrozen({ key, data: live, seq: getLastArrivalSeq() });
  };

  return { shown, pendingIds, highlightIds, onFocus, onBlur, showNew };
}

/** Lista priorizada de alertas (doc 09 §3.3): filtros en la URL, tabla, paginación y 4 estados. */
export function AlertsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseAlertFilters(searchParams), [searchParams]);
  const highlightId = searchParams.get(HIGHLIGHT_PARAM);

  const alerts = useAlerts(filters);
  const zones = useZones();
  const alertTypes = useAlertTypes();
  const sources = useSources();

  const setFilters = useCallback(
    (next: AlertFilters) => setSearchParams(toSearchParams(next)),
    [setSearchParams],
  );

  // El resaltado dura 2 s; después se retira de la URL sin añadir una entrada al historial.
  useEffect(() => {
    if (!highlightId) return;
    const timer = setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete(HIGHLIGHT_PARAM);
          return next;
        },
        { replace: true },
      );
    }, HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [highlightId, setSearchParams]);

  const listKey = searchParams.toString();
  const liveList = useLiveAlertList(listKey, alerts.data, alerts.isPlaceholderData);
  const tableRegionRef = useRef<HTMLDivElement>(null);
  const focusRowAfterShow = useRef<string | null>(null);

  // Tras "Mostrar", el foco pasa a la primera alerta nueva (la píldora desaparece).
  useEffect(() => {
    const id = focusRowAfterShow.current;
    if (!id) return;
    const row = tableRegionRef.current?.querySelector<HTMLElement>(`tr[data-alert-id="${CSS.escape(id)}"]`);
    if (!row) return;
    focusRowAfterShow.current = null;
    row.focus();
  }, [liveList.shown]);

  const onShowNew = () => {
    focusRowAfterShow.current = liveList.pendingIds[0] ?? null;
    liveList.showNew();
  };

  const pendingCount = liveList.pendingIds.length;
  const filtered = hasActiveFilters(filters);
  const data = liveList.shown;

  let content;
  if (alerts.isPending) {
    content = <Skeleton variant="table" rows={8} label="Cargando alertas…" />;
  } else if (alerts.isError && !data) {
    content = (
      <ErrorState
        title="No se pudieron cargar las alertas"
        message={alerts.error.message}
        onRetry={() => void alerts.refetch()}
        retrying={alerts.isFetching}
      />
    );
  } else if (!data || data.items.length === 0) {
    content = filtered ? (
      <EmptyState
        icon={SearchX}
        title="Sin alertas que coincidan"
        message="Prueba con otros filtros o límpialos para ver todas las alertas activas."
        actionLabel="Limpiar filtros"
        onAction={() => setFilters(clearAlertFilters(filters))}
      />
    ) : (
      <EmptyState
        icon={ShieldCheck}
        title="Sin alertas activas"
        message="No hay alertas nuevas ni en revisión. Las detecciones nuevas aparecerán aquí."
        actionLabel={filters.page > 1 ? 'Ir a la primera página' : undefined}
        onAction={filters.page > 1 ? () => setFilters({ ...filters, page: 1 }) : undefined}
      />
    );
  } else {
    content = (
      <div className={`space-y-3 transition-opacity duration-200 ${alerts.isPlaceholderData ? 'opacity-60' : ''}`}>
        <div ref={tableRegionRef} onFocus={liveList.onFocus} onBlur={liveList.onBlur} className="space-y-2">
          <div aria-live="polite" className="flex justify-center">
            {pendingCount > 0 && (
              <button
                type="button"
                onClick={onShowNew}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand-600 px-4 text-sm font-medium text-white shadow-md transition-colors duration-200 hover:bg-brand-700"
              >
                <ArrowUp aria-hidden="true" className="size-4" />
                {pendingCount === 1 ? '1 alerta nueva' : `${pendingCount} alertas nuevas`} · Mostrar
              </button>
            )}
          </div>
          <AlertTable
            alerts={data.items}
            sort={filters.sort}
            onSortChange={(sort) => setFilters({ ...filters, sort, page: 1 })}
            onOpen={(id) => navigate(`/alertas/${encodeURIComponent(id)}`)}
            highlightId={highlightId}
            highlightIds={liveList.highlightIds}
            caption={`Alertas ordenadas por prioridad. ${data.total} en total.`}
          />
        </div>
        <Pagination
          page={data.page}
          pageSize={data.pageSize || ALERTS_PAGE_SIZE}
          total={data.total}
          onPageChange={(page) => setFilters({ ...filters, page })}
          itemLabel="alerta"
          itemsLabel="alertas"
        />
      </div>
    );
  }

  return (
    <section aria-labelledby="alerts-title" className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id="alerts-title" className="text-2xl font-semibold text-slate-900">
            Alertas
          </h1>
          <p className="text-sm text-slate-600">
            Priorizadas por score. La IA sugiere; la decisión siempre es humana.
          </p>
        </div>
        <Button icon={Plus} onClick={openReportEvent}>
          Reportar evento
        </Button>
      </header>

      <FilterBar
        filters={filters}
        onChange={setFilters}
        zones={zones.data ?? []}
        alertTypes={alertTypes.data ?? []}
        sources={sources.data ?? []}
      />

      <div aria-busy={alerts.isFetching || undefined}>{content}</div>
    </section>
  );
}
