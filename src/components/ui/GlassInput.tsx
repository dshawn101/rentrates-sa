import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="glass-label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'glass-input w-full',
            error && 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-400 mt-1">{error}</p>
        )}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';
