import { ShieldCheck } from 'lucide-react';

export interface LogoProps {
  /** `light` para fondos oscuros (sidebar), `dark` para fondos claros. */
  tone?: 'light' | 'dark';
  /** Oculta el texto por debajo de 1024 px (sidebar colapsado). */
  collapsible?: boolean;
}

export function Logo({ tone = 'dark', collapsible = false }: LogoProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
        <ShieldCheck aria-hidden="true" className="size-5" />
      </span>
      <span
        className={[
          'text-lg font-semibold tracking-tight whitespace-nowrap',
          tone === 'light' ? 'text-white' : 'text-navy-950',
          collapsible ? 'sr-only lg:not-sr-only' : '',
        ].join(' ')}
      >
        AeroSecure AI
      </span>
    </span>
  );
}
