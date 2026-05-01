import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-[28px] border border-white/10 bg-white/5 shadow-xl shadow-black/20', className)}>
      {children}
    </div>
  );
}
