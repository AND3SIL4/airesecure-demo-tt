import { useEffect } from 'react';
import { Link, useRouteError } from 'react-router-dom';
import { ErrorState } from '../components/ErrorState';
import { DemoBanner } from '../layout/DemoBanner';

/** Fallo al descargar el fragmento de una vista diferida (red caída o la aplicación se actualizó). */
function isChunkLoadError(error: unknown): boolean {
  return (
    error instanceof Error &&
    /dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
      error.message,
    )
  );
}

/**
 * Error inesperado al renderizar una vista (doc 09 §4): sustituye la pantalla genérica en inglés de React Router
 * por un estado de error en español con "Reintentar" (recarga la página) y un enlace al Resumen.
 */
/** `standalone`: se usa en la raíz, fuera del Shell, y debe mostrar el banner de demostración (constitución IV). */
export function RouteErrorPage({ standalone = false }: { standalone?: boolean }) {
  const error = useRouteError();

  useEffect(() => {
    console.error(error);
  }, [error]);

  const message = isChunkLoadError(error)
    ? 'No se pudo descargar esta vista. Comprueba que la demo siga en ejecución y vuelve a intentarlo.'
    : 'Ocurrió un error inesperado al mostrar esta vista. Vuelve a intentarlo o regresa al Resumen.';

  return (
    <>
    {standalone && <DemoBanner />}
    <div className="px-4 py-10">
      <ErrorState
        title="No se pudo mostrar esta vista"
        message={message}
        onRetry={() => window.location.reload()}
        extraActions={
          <Link
            to="/"
            className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-surface px-4 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Ir al Resumen
          </Link>
        }
        className="mx-auto max-w-xl"
      />
    </div>
    </>
  );
}
