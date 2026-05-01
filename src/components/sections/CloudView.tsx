'use client';

import { Activity, Cloud, Server, Database, Globe, ArrowRightLeft, RadioReceiver } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { SectionTitle } from '@/components/ui/SectionTitle';

export function CloudView() {
  return (
    <section>
      <Card className="p-6 md:p-7">
        <SectionTitle
          eyebrow="Sanctuary Cloud"
          title="Network Operations Center"
          description="Monitor real-time synchronization between local FOH controllers, physical Beams, and the global Sanctuary Cloud."
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_250px]">
          {/* Topology Map */}
          <div className="rounded-[24px] border border-white/10 bg-slate-900/50 p-6 flex flex-col justify-between min-h-[400px]">
            <h4 className="text-sm font-semibold text-slate-300 mb-6 flex items-center gap-2">
              <Globe className="h-4 w-4 text-sky-400" /> Active Campus Topology
            </h4>
            
            <div className="flex-1 flex items-center justify-center relative my-8">
              {/* Central Cloud Node */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 shadow-[0_0_30px_rgba(56,189,248,0.4)] flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full border border-sky-300/30 animate-[ping_3s_ease-in-out_infinite]"></div>
                  <Cloud className="h-8 w-8 text-white" />
                </div>
                <p className="text-center mt-3 text-sm font-bold text-sky-200">Global Cloud</p>
              </div>

              {/* Connecting Lines */}
              <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 400 200" preserveAspectRatio="none">
                <path d="M50 100 Q 200 100 200 100" stroke="rgba(56,189,248,0.3)" strokeWidth="2" strokeDasharray="5,5" className="animate-[dash_2s_linear_infinite]" />
                <path d="M350 100 Q 200 100 200 100" stroke="rgba(56,189,248,0.3)" strokeWidth="2" strokeDasharray="5,5" className="animate-[dash_2s_linear_infinite_reverse]" />
                <path d="M200 50 Q 200 100 200 100" stroke="rgba(56,189,248,0.3)" strokeWidth="2" strokeDasharray="5,5" className="animate-[dash_2s_linear_infinite]" />
              </svg>

              {/* Edge Nodes */}
              <div className="absolute left-[5%] top-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="h-14 w-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center relative">
                   <div className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full animate-pulse"></div>
                   <Server className="h-6 w-6 text-slate-300" />
                </div>
                <p className="text-center mt-2 text-xs font-medium text-slate-300">Dodoma HQ<br/><span className="text-[10px] text-slate-500">Local FOH</span></p>
              </div>

              <div className="absolute right-[5%] top-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="h-14 w-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center relative">
                   <div className="absolute -top-1 -right-1 h-3 w-3 bg-amber-500 rounded-full animate-pulse"></div>
                   <Server className="h-6 w-6 text-slate-300" />
                </div>
                <p className="text-center mt-2 text-xs font-medium text-slate-300">Arusha Ext<br/><span className="text-[10px] text-slate-500">Syncing...</span></p>
              </div>
            </div>
            
            <div className="mt-8 flex justify-between px-4 text-xs text-slate-400">
               <span className="flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-emerald-400" /> Sync Latency: 12ms</span>
               <span className="flex items-center gap-1.5"><Database className="h-3.5 w-3.5 text-indigo-400" /> Atmos Database: Synced</span>
            </div>
          </div>

          {/* Sync & Fleet Status Sidebar */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-900/80 p-5 border border-white/5">
              <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <RadioReceiver className="h-4 w-4" /> Hardware Fleet
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-slate-400">Total Beams</p>
                    <p className="text-xl font-bold text-slate-100">14</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Online</p>
                    <p className="text-lg font-medium text-emerald-400">12</p>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[85%] rounded-full shadow-[0_0_10px_theme(colors.emerald.500)]"></div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/80 p-5 border border-white/5 flex-1">
              <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4" /> Live Events
              </h4>
              <div className="space-y-3">
                {[
                  { tag: 'PUSH', desc: 'Atmosphere transition', time: 'Just now', color: 'text-sky-400' },
                  { tag: 'PULL', desc: 'Arusha joined session', time: '2m ago', color: 'text-indigo-400' },
                  { tag: 'SYNC', desc: 'Room profiles updated', time: '15m ago', color: 'text-emerald-400' },
                ].map((log, i) => (
                  <div key={i} className="flex justify-between items-start border-b border-white/5 pb-2 last:border-0 last:pb-0">
                    <div>
                      <span className={`text-[10px] font-bold ${log.color}`}>{log.tag}</span>
                      <p className="text-xs text-slate-300 mt-0.5">{log.desc}</p>
                    </div>
                    <span className="text-[10px] text-slate-500">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
