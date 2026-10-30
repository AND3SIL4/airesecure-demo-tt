import { LoaderCircle, type LucideIcon } from 'lucide-react';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: LucideIcon;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 border-transparent',
  secondary: 'bg-surface text-slate-800 border-slate-300 hover:bg-slate-50',
  ghost: 'bg-transparent text-slate-700 border-transparent hover:bg-slate-100',
  danger: 'bg-sev-critica-text text-white border-transparent hover:bg-red-800',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, icon: Icon, disabled, className = '', children, type, ...rest },
  ref,
) {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={[
        'inline-flex items-center justify-center rounded-md border font-medium whitespace-nowrap',
        'transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
      ) : (
        Icon && <Icon aria-hidden="true" className="size-4" />
      )}
      {children}
    </button>
  );
});
