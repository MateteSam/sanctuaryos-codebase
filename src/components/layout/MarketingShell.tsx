import type { ReactNode } from 'react';
import { Footer } from '@/components/layout/Footer';

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="relative mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-10">
        {children}
        <Footer />
      </div>
    </div>
  );
}
