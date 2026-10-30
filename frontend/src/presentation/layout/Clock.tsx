import { useEffect, useState } from 'react';
import { formatClock } from '../../domain/format';

const REFRESH_MS = 30_000;

/** Reloj en America/Bogota (`dd MMM yyyy HH:mm`), actualizado cada 30 s. */
export function Clock({ className = '' }: { className?: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <time dateTime={now.toISOString()} className={`tabular whitespace-nowrap ${className}`}>
      {formatClock(now)}
    </time>
  );
}
