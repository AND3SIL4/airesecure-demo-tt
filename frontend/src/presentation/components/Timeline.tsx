import { ArrowRight } from 'lucide-react';
import { formatDuration } from '../../domain/format';
import {
  SYSTEM_ACTOR_LABEL,
  payloadIncidentId,
  payloadResolutionSeconds,
  payloadTeamName,
  timelineActionMeta,
} from '../../domain/timeline';
import type { TimelineEvent } from '../../domain/types';
import { TIMELINE_ICONS } from './icons';
import { RelativeTime } from './RelativeTime';
import { StatusBadge } from './StatusBadge';

export interface TimelineProps {
  events: readonly TimelineEvent[];
  className?: string;
}

/** Historial en orden cronológico: acción, actor (o Sistema), cambio de estado, comentario y hora. */
export function Timeline({ events, className = '' }: TimelineProps) {
  if (events.length === 0) {
    return <p className={`text-sm text-slate-600 ${className}`}>Sin eventos registrados.</p>;
  }

  return (
    <ol className={`relative space-y-4 ${className}`}>
      {events.map((event, index) => {
        const meta = timelineActionMeta(event.action);
        const Icon = TIMELINE_ICONS[meta.icon];
        const incidentId = event.action === 'incident_created' ? payloadIncidentId(event) : null;
        const teamName = payloadTeamName(event);
        const resolutionSeconds = payloadResolutionSeconds(event);
        const isLast = index === events.length - 1;
        return (
          <li key={event.id} className="relative flex gap-3">
            {!isLast && (
              <span aria-hidden="true" className="absolute top-8 bottom-[-1rem] left-[0.9375rem] w-px bg-slate-200" />
            )}
            <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-surface-muted text-navy-900">
              <Icon aria-hidden="true" className="size-4" />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="text-sm text-slate-900">
                  <span className="font-semibold">{meta.label}</span>
                  {incidentId && <span className="tabular"> {incidentId}</span>}
                  {teamName && <span>{event.action === 'escalate' ? ' a ' : ': '}{teamName}</span>}
                  {resolutionSeconds !== null && (
                    <span className="tabular text-slate-600"> en {formatDuration(resolutionSeconds)}</span>
                  )}
                  <span className="text-slate-600"> · {event.actor?.alias ?? SYSTEM_ACTOR_LABEL}</span>
                </p>
                <RelativeTime value={event.createdAt} focusable className="text-xs text-slate-600" />
              </div>
              {event.toStatus && event.toStatus !== event.fromStatus && (
                <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                  {event.fromStatus && (
                    <>
                      <StatusBadge status={event.fromStatus} size="sm" />
                      <ArrowRight aria-hidden="true" className="size-3.5" />
                      <span className="sr-only">a</span>
                    </>
                  )}
                  <StatusBadge status={event.toStatus} size="sm" />
                </p>
              )}
              {event.comment && (
                <blockquote className="mt-2 rounded-md border-l-2 border-slate-300 bg-surface-muted px-3 py-2 text-sm whitespace-pre-line text-slate-700">
                  {event.comment}
                </blockquote>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
