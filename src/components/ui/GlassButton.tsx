import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {

    const baseVariantClass = {
      primary: 'glass-button',
      secondary: 'glass-button-secondary',
      ghost: 'glass-button-ghost'
    }[variant];

    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(
          baseVariantClass,
          size === 'sm' && 'px-3 py-1.5 text-sm',
          size === 'md' && 'px-4 py-2',
          size === 'lg' && 'px-6 py-3 text-lg',
          'inline-flex items-center justify-center gap-2',
          (isLoading || disabled) && 'opacity-50 cursor-not-allowed hover:translate-y-0',
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

GlassButton.displayName = 'GlassButton';
