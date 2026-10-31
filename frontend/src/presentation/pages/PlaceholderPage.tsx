import { Construction } from 'lucide-react';
import { UPCOMING_FEATURE_MESSAGE } from '../../domain/navigation';
import { EmptyState } from '../components/EmptyState';

export interface PlaceholderPageProps {
  title: string;
}

/** Vista provisional para las secciones que llegan en las próximas features. */
export function PlaceholderPage({ title }: PlaceholderPageProps) {
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
    </section>
  );
}
