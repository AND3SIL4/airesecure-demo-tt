/** Enlace "Saltar al contenido" visible solo con el foco del teclado. */
export function SkipLink() {
  return (
    <a
      href="#contenido"
      className="sr-only focus:not-sr-only focus:fixed focus:top-10 focus:left-4 focus:z-[70] focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-700 focus:shadow-lg"
    >
      Saltar al contenido
    </a>
  );
}
