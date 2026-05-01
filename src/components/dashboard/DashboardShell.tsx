'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { AppTopbar } from '@/components/dashboard/AppTopbar';
import { Sidebar } from '@/components/dashboard/Sidebar';

export function DashboardShell({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title: string;
  description?: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#020408] text-slate-100 font-outfit">
      <div className="relative mx-auto max-w-[1680px]">
        <div className="flex gap-0 lg:gap-0">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <main className="flex-1 min-w-0 p-3 lg:p-4">
            <AppTopbar
              title={title}
              description={description}
              onToggleSidebar={() => setSidebarOpen(true)}
            />
            <div className="min-h-[calc(100vh-120px)]">
              {children}
            </div>
            {/* Minimal footer */}
            <div className="mt-8 py-4 text-center">
              <span className="text-[7px] font-mono font-bold text-slate-800 uppercase tracking-[0.3em]">
                SanctuaryOS · Broadcast Engine v4.2
              </span>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
