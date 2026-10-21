import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className, label }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-2" role="status">
      <Loader2 className={cn('animate-spin text-primary shrink-0', sizeClasses[size], className)} />
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;
