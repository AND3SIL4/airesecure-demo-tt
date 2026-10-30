import { MapPinOff } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  useEffect(() => {
    document.title = 'No encontrado · AeroSecure AI · Demo';
  }, []);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <section className="flex max-w-md flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-surface p-8 text-center shadow-lg">
        <span className="flex size-12 items-center justify-center rounded-full bg-surface-muted text-slate-600">
          <MapPinOff aria-hidden="true" className="size-6" />
        </span>
        <h1 className="text-xl font-semibold text-slate-900">Página no encontrada</h1>
        <p className="text-sm text-slate-600">La dirección que buscas no existe en la demo.</p>
        <Link
          to="/"
          className="mt-2 inline-flex h-10 items-center rounded-md bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
        >
          Ir al Resumen
        </Link>
      </section>
    </div>
  );
}
