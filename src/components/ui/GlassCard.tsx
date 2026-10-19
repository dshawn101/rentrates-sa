import { cn } from '../../lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'panel';
}

export function GlassCard({ children, className, variant = 'default', ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        variant === 'default' ? 'glass-card' : 'glass-panel',
        className
      )}
      {...props}
    >
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
