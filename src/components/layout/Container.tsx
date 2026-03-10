import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export function Container({ children, className, size = 'lg' }: ContainerProps) {
  const maxWClass = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-7xl',
    full: 'max-w-full'
  }[size];

  return (
    <div className={cn('mx-auto w-full', maxWClass, className)}>
      {children}
    </div>
  );
}
