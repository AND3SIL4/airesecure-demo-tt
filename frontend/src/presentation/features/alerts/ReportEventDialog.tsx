import { useId, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlertTypes, useZones } from '../../../application/hooks/useCatalogs';
import { useReportEvent } from '../../../application/hooks/useReportEvent';
import { closeReportEvent } from '../../../application/stores/reportEvent';
import { SEVERITIES } from '../../../domain/severity';
import { TEXT_LIMITS, type Severity } from '../../../domain/types';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { ErrorState } from '../../components/ErrorState';
import { SeverityBadge } from '../../components/SeverityBadge';
import { Skeleton } from '../../components/Skeleton';

type Field = 'type' | 'zone' | 'severity' | 'description';

const FIELD_CLASS =
  'w-full rounded-md border border-slate-300 bg-surface px-3 text-sm aria-invalid:border-sev-critica-text disabled:opacity-60';

/**
 * Modal global "Reportar evento" (doc 09 §3.11). Se monta en el Shell solo mientras está abierto.
 * Tras el éxito cierra y navega a la lista resaltando la alerta creada.
 */
export function ReportEventDialog() {
  const navigate = useNavigate();
  const types = useAlertTypes();
  const zones = useZones();
  const report = useReportEvent();

  const [typeCode, setTypeCode] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [description, setDescription] = useState('');
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const typeRef = useRef<HTMLSelectElement>(null);

  const formId = useId();
  const ids = { type: useId(), zone: useId(), description: useId(), counter: useId() };
  const errIds = { type: useId(), zone: useId(), severity: useId(), description: useId() };

  const trimmed = description.trim();
  const errors: Record<Field, string> = {
    type: typeCode ? '' : 'Selecciona un tipo.',
    zone: zoneId ? '' : 'Selecciona una zona.',
    severity: severity ? '' : 'Selecciona una severidad.',
    description:
      trimmed.length < TEXT_LIMITS.descriptionMin
        ? `Describe el evento con al menos ${TEXT_LIMITS.descriptionMin} caracteres.`
        : '',
  };
  const valid = Object.values(errors).every((e) => e === '');
  const shown = (field: Field) => (touched[field] ? errors[field] : '');
  const busy = report.isPending;

  const onTypeChange = (code: string) => {
    setTypeCode(code);
    setTouched((t) => ({ ...t, type: true }));
    const defaultSeverity = types.data?.find((t) => t.code === code)?.defaultSeverity;
    if (defaultSeverity) setSeverity(defaultSeverity);
  };

  const close = () => {
    if (!busy) closeReportEvent();
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setTouched({ type: true, zone: true, severity: true, description: true });
    if (!valid || !severity) return;
    report.mutate(
      { typeCode, zoneId, severity, description: trimmed },
      {
        onSuccess: (alert) => {
          closeReportEvent();
          navigate(`/alertas?highlight=${encodeURIComponent(alert.id)}`);
        },
      },
    );
  };

  const loadingCatalogs = types.isPending || zones.isPending;
  const catalogError = types.error ?? zones.error;

  return (
    <Dialog
      open
      onClose={close}
      title="Reportar evento"
      description="Registra un evento observado. Se creará una alerta nueva con origen manual, sin confianza del modelo."
      preventClose={busy}
      initialFocusRef={typeRef}
      className="w-[min(36rem,calc(100vw-2rem))]"
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={busy}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={busy} disabled={!valid || loadingCatalogs}>
            Reportar
          </Button>
        </>
      }
    >
      {loadingCatalogs && <Skeleton rows={5} label="Cargando el formulario…" />}
      {!loadingCatalogs && catalogError && (
        <ErrorState
          title="No se pudo cargar el formulario"
          message={catalogError.message}
          onRetry={() => {
            void types.refetch();
            void zones.refetch();
          }}
          retrying={types.isFetching || zones.isFetching}
        />
      )}
      {types.data && zones.data && (
        <form id={formId} onSubmit={submit} noValidate className="space-y-4">
          <div className="space-y-1">
            <label htmlFor={ids.type} className="text-sm font-medium text-slate-800">
              Tipo
            </label>
            <select
              ref={typeRef}
              id={ids.type}
              value={typeCode}
              disabled={busy}
              required
              aria-invalid={shown('type') ? true : undefined}
              aria-describedby={errIds.type}
              onChange={(event) => onTypeChange(event.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, type: true }))}
              className={`h-10 ${FIELD_CLASS}`}
            >
              <option value="">Selecciona un tipo</option>
              {types.data.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.name}
                </option>
              ))}
            </select>
            <p id={errIds.type} className="text-xs text-sev-critica-text">
              {shown('type')}
            </p>
          </div>

          <div className="space-y-1">
            <label htmlFor={ids.zone} className="text-sm font-medium text-slate-800">
              Zona
            </label>
            <select
              id={ids.zone}
              value={zoneId}
              disabled={busy}
              required
              aria-invalid={shown('zone') ? true : undefined}
              aria-describedby={errIds.zone}
              onChange={(event) => {
                setZoneId(event.target.value);
                setTouched((t) => ({ ...t, zone: true }));
              }}
              onBlur={() => setTouched((t) => ({ ...t, zone: true }))}
              className={`h-10 ${FIELD_CLASS}`}
            >
              <option value="">Selecciona una zona</option>
              {zones.data.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                  {z.restricted ? ' (restringida)' : ''}
                </option>
              ))}
            </select>
            <p id={errIds.zone} className="text-xs text-sev-critica-text">
              {shown('zone')}
            </p>
          </div>

          <fieldset aria-describedby={errIds.severity} className="space-y-2">
            <legend className="mb-1 text-sm font-medium text-slate-800">Severidad sugerida</legend>
            <div className="flex flex-wrap gap-2">
              {SEVERITIES.map((s) => (
                <label
                  key={s}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-2 py-1.5 hover:bg-slate-50 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-600/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-600"
                >
                  <input
                    type="radio"
                    name="report-severity"
                    value={s}
                    checked={severity === s}
                    disabled={busy}
                    onChange={() => {
                      setSeverity(s);
                      setTouched((t) => ({ ...t, severity: true }));
                    }}
                    className="size-4 accent-brand-600"
                  />
                  <SeverityBadge severity={s} size="sm" />
                </label>
              ))}
            </div>
            <p id={errIds.severity} className="text-xs text-sev-critica-text">
              {shown('severity')}
            </p>
          </fieldset>

          <div className="space-y-1">
            <label htmlFor={ids.description} className="text-sm font-medium text-slate-800">
              Descripción
            </label>
            <textarea
              id={ids.description}
              value={description}
              maxLength={TEXT_LIMITS.descriptionMax}
              rows={4}
              disabled={busy}
              required
              aria-invalid={shown('description') ? true : undefined}
              aria-describedby={`${errIds.description} ${ids.counter}`}
              onChange={(event) => setDescription(event.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, description: true }))}
              placeholder="Qué observaste y dónde, p. ej.: posible objeto sin supervisión junto al mostrador 4"
              className={`py-2 placeholder:text-slate-500 ${FIELD_CLASS}`}
            />
            <div className="flex items-start justify-between gap-3 text-xs">
              <p id={errIds.description} className="text-sev-critica-text">
                {shown('description')}
              </p>
              <p id={ids.counter} className="tabular shrink-0 text-slate-600">
                {description.length} / {TEXT_LIMITS.descriptionMax}
              </p>
            </div>
          </div>
        </form>
      )}
    </Dialog>
  );
}
