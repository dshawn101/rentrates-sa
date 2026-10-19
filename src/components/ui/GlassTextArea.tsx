import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface GlassTextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const GlassTextArea = forwardRef<HTMLTextAreaElement, GlassTextAreaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="glass-label">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'glass-textarea w-full',
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

GlassTextArea.displayName = 'GlassTextArea';