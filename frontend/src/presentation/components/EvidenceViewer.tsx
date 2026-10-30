import { Cctv, ImageOff, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { EVIDENCE_LEGEND, evidenceMeta } from '../../domain/evidence';
import { RelativeTime } from './RelativeTime';

export interface EvidenceViewerProps {
  evidenceUrl: string;
  typeCode: string;
  sourceLabel: string;
  /** ISO 8601 de la detección. */
  detectedAt: string;
  className?: string;
}

/**
 * Evidencia ilustrativa en un marco de cámara: fuente y hora, el SVG del tipo y el recuadro de
 * detección sobre el objeto (nunca sobre personas), con la leyenda de privacidad.
 */
export function EvidenceViewer({ evidenceUrl, typeCode, sourceLabel, detectedAt, className = '' }: EvidenceViewerProps) {
  const meta = evidenceMeta(typeCode);
  const [failed, setFailed] = useState(false);
  const { x, y, w, h } = meta.box;

  return (
    <figure className={`overflow-hidden rounded-lg border border-navy-900/40 bg-navy-950 ${className}`}>
      <div className="flex items-center justify-between gap-3 px-3 py-2 text-xs text-slate-200">
        <span className="inline-flex min-w-0 items-center gap-2">
          <Cctv aria-hidden="true" className="size-4 shrink-0" />
          <span className="truncate font-medium">{sourceLabel}</span>
        </span>
        <RelativeTime value={detectedAt} focusable tooltipSide="bottom-end" className="text-slate-200" />
      </div>

      <div className="relative aspect-video w-full bg-slate-800">
        {failed ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-slate-300">
            <ImageOff aria-hidden="true" className="size-6" />
            <span>No se pudo cargar la ilustración.</span>
          </div>
        ) : (
          <>
            <img
              src={evidenceUrl}
              alt={meta.alt}
              onError={() => setFailed(true)}
              className="block h-full w-full object-fill"
              draggable={false}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute rounded-sm border-2 border-sev-media shadow-[0_0_0_1px_rgb(11_27_51/0.6)]"
              style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` }}
            >
              <span className="absolute -top-5 left-[-2px] rounded-t-sm bg-sev-media px-1.5 py-0.5 text-[10px] leading-none font-semibold whitespace-nowrap text-navy-950">
                {meta.boxLabel}
              </span>
            </div>
          </>
        )}
      </div>

      <figcaption className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-200">
        <ShieldCheck aria-hidden="true" className="size-3.5" />
        {EVIDENCE_LEGEND}
        <span className="sr-only">. Recuadro de detección: {meta.boxLabel}.</span>
      </figcaption>
    </figure>
  );
}
