import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useAlertOutcomes,
  useAnomalies,
  useIncidentsByType,
  useIncidentsByZone,
  useIncidentsTrend,
  useIncidentTimes,
} from '../../application/hooks/useAnalytics';
import {
  ANALYTICS_HINTS,
  ANALYTICS_TITLES,
  daysToSearchParams,
  parseDays,
  type AnalyticsDays,
} from '../../domain/analytics';
import { AnalyticsCard } from '../features/analysis/AnalyticsCard';
import { ByTypeChart } from '../features/analysis/ByTypeChart';
import { ByZoneChart } from '../features/analysis/ByZoneChart';
import { DailyTrendChart } from '../features/analysis/DailyTrendChart';
import { DaysSelector } from '../features/analysis/DaysSelector';
import { OutcomesDonut } from '../features/analysis/OutcomesDonut';
import { TimesPanel } from '../features/analysis/TimesPanel';
import { AnomaliesContent } from '../features/summary/AnomaliesList';

/** Análisis y tendencias (doc 09 §3.8): 6 bloques independientes con el rango `?days=` en la URL. */
export function AnalysisPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const days = parseDays(searchParams.get('days'));

  const byZone = useIncidentsByZone(days);
  const byType = useIncidentsByType(days);
  const trend = useIncidentsTrend(days);
  const outcomes = useAlertOutcomes(days);
  const times = useIncidentTimes(days);
  const anomalies = useAnomalies();

  const setDays = useCallback(
    (next: AnalyticsDays) => setSearchParams(daysToSearchParams(next)),
    [setSearchParams],
  );

  return (
    <section aria-labelledby="analysis-title" className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 id="analysis-title" className="text-2xl font-semibold text-slate-900">
            Análisis
          </h1>
          <p className="text-sm text-slate-600">
            Tendencias de los últimos {days} días para decidir medidas preventivas. Datos de la demo.
          </p>
        </div>
        <DaysSelector value={days} onChange={setDays} />
      </header>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <AnalyticsCard title={ANALYTICS_TITLES.byZone} hint={ANALYTICS_HINTS.byZone} query={byZone} skeletonClassName="h-72">
          {(data) => <ByZoneChart items={data} days={days} />}
        </AnalyticsCard>
        <AnalyticsCard title={ANALYTICS_TITLES.byType} hint={ANALYTICS_HINTS.byType} query={byType} skeletonClassName="h-72">
          {(data) => <ByTypeChart items={data} days={days} />}
        </AnalyticsCard>
        <AnalyticsCard title={ANALYTICS_TITLES.trend} hint={ANALYTICS_HINTS.trend} query={trend} skeletonClassName="h-72">
          {(data) => <DailyTrendChart points={data} days={days} />}
        </AnalyticsCard>
        <AnalyticsCard
          title={ANALYTICS_TITLES.outcomes}
          hint={ANALYTICS_HINTS.outcomes}
          query={outcomes}
          skeletonClassName="h-72"
        >
          {(data) => <OutcomesDonut outcomes={data} days={days} />}
        </AnalyticsCard>
        <AnalyticsCard title={ANALYTICS_TITLES.times} hint={ANALYTICS_HINTS.times} query={times} skeletonClassName="h-72">
          {(data) => <TimesPanel times={data} days={days} />}
        </AnalyticsCard>
        <AnalyticsCard
          title={ANALYTICS_TITLES.anomalies}
          hint={ANALYTICS_HINTS.anomalies}
          query={anomalies}
          skeletonClassName="h-48"
        >
          {(data) => <AnomaliesContent anomalies={data} />}
        </AnalyticsCard>
      </div>
    </section>
  );
}
