import { BellRing, Clock3, Construction, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from '../../application/stores/toasts';
import { UPCOMING_FEATURE_MESSAGE } from '../../domain/navigation';
import { SEVERITIES } from '../../domain/severity';
import { ALERT_STATUSES, INCIDENT_STATUSES } from '../../domain/status';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { KpiCard } from '../components/KpiCard';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';

export interface PlaceholderPageProps {
  title: string;
  /** Muestra la vista previa de los componentes base (temporal; se retira en la feature 005). */
  showComponentPreview?: boolean;
}

/** Vista previa temporal de los componentes del sistema visual (US5). */
function ComponentPreview() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const confirm = () => {
    setLoading(true);
    timerRef.current = setTimeout(() => {
      setLoading(false);
      setOpen(false);
      toast.success('Acción de ejemplo confirmada. No se modificó ningún dato.');
    }, 800);
  };

  return (
    <Card title="Vista previa de componentes" className="space-y-1">
      <p className="mb-4 text-sm text-slate-600">
        Sección temporal para revisar los componentes base. Los valores son de ejemplo.
      </p>
      <div className="space-y-5">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Severidad</h3>
          <div className="flex flex-wrap items-center gap-2">
            {SEVERITIES.map((s) => (
              <SeverityBadge key={s} severity={s} />
            ))}
            <SeverityBadge severity="normal" size="sm" />
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Estados de alerta e incidente</h3>
          <div className="flex flex-wrap items-center gap-2">
            {[...ALERT_STATUSES, ...INCIDENT_STATUSES].map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <KpiCard icon={BellRing} label="Alertas activas (ejemplo)" value={12} delta={{ value: 20, label: 'vs. ayer' }} higherIsWorse />
          <KpiCard icon={Clock3} label="Tiempo medio de respuesta (ejemplo)" value="4,2 min" delta={{ value: -15, label: 'vs. ayer' }} higherIsWorse />
        </div>
        <div>
          <Button variant="danger" icon={Trash2} onClick={() => setOpen(true)}>
            Abrir confirmación de ejemplo
          </Button>
        </div>
      </div>
      <ConfirmDialog
        open={open}
        title="¿Confirmar la acción de ejemplo?"
        description="Este diálogo es una demostración del componente ConfirmDialog. No modifica ningún dato."
        confirmLabel="Confirmar acción"
        variant="danger"
        loading={loading}
        onConfirm={confirm}
        onCancel={() => {
          if (timerRef.current) clearTimeout(timerRef.current);
          setLoading(false);
          setOpen(false);
        }}
      />
    </Card>
  );
}

/** Vista provisional para las secciones que llegan en las próximas features. */
export function PlaceholderPage({ title, showComponentPreview = false }: PlaceholderPageProps) {
  return (
    <section aria-labelledby="placeholder-title" className="space-y-6">
      <h1 id="placeholder-title" className="text-2xl font-semibold text-slate-900">
        {title}
      </h1>
      <EmptyState
        icon={Construction}
        title={UPCOMING_FEATURE_MESSAGE}
        message={`La sección ${title} se habilitará en las siguientes entregas de la demo.`}
      />
      {showComponentPreview && <ComponentPreview />}
    </section>
  );
}
