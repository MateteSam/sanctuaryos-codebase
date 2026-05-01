'use client';

import { PanelLeft, Maximize, Lightbulb, Grid, Save, Edit3 } from 'lucide-react';
import { rooms } from '@/data/rooms';
import { Card } from '@/components/ui/Card';
import { SectionTitle } from '@/components/ui/SectionTitle';

export function RoomsView() {
  return (
    <section>
      <Card className="p-6 md:p-7">
        <SectionTitle
          eyebrow="Environments"
          title="Room Configuration & Lighting"
          description="Define physical dimensions for holographic anchoring and connect traditional DMX/sACN lighting systems."
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Grid className="h-4 w-4 text-indigo-400" /> Active Room Profiles
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              {rooms.map((room) => (
                <div key={room.name} className="relative rounded-[20px] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-5 group hover:border-sky-500/30 transition">
                  <div className="absolute top-4 right-4 bg-sky-500/10 text-sky-400 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition cursor-pointer">
                    <Edit3 className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center">
                      <PanelLeft className="h-5 w-5 text-sky-300" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-100">{room.name}</h3>
                      <p className="text-xs text-slate-400">Profile: {room.profile}</p>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-2 border-t border-white/5 pt-4">
                     <div>
                       <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Dimensions</p>
                       <p className="text-sm font-medium text-slate-300 flex items-center gap-1"><Maximize className="h-3 w-3" /> 120' x 80'</p>
                     </div>
                     <div>
                       <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Assigned Beams</p>
                       <p className="text-sm font-medium text-slate-300">{room.beams}</p>
                     </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full rounded-2xl border border-dashed border-sky-500/30 bg-sky-500/5 py-4 text-sm font-medium text-sky-400 hover:bg-sky-500/10 transition">
              + Create New Room Profile
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-[24px] border border-white/10 bg-slate-900 flex-1 p-5 lg:p-6 flex flex-col">
              <h4 className="text-sm font-semibold text-slate-300 mb-6 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-emerald-400" /> Lighting Ecosystem (DMX/sACN)
              </h4>

              <div className="space-y-5 flex-1">
                <div className="rounded-xl border border-white/5 bg-slate-800/50 p-4">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium text-slate-200">Protocol</label>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md uppercase tracking-wider">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></div> Active
                    </span>
                  </div>
                  <select className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-sm text-slate-300 outline-none">
                    <option>Art-Net / sACN</option>
                    <option>DMX512 (USB Interface)</option>
                    <option>OSC Triggering</option>
                  </select>
                </div>

                <div className="rounded-xl border border-white/5 bg-slate-800/50 p-4">
                  <label className="text-sm font-medium text-slate-200 block mb-2">Universe Assignment</label>
                  <input type="number" defaultValue="1" className="w-full bg-slate-950 border border-white/10 rounded-lg p-2.5 text-sm text-slate-300 outline-none" />
                </div>

                <div className="rounded-xl border border-white/5 bg-slate-800/50 p-4">
                  <p className="text-xs leading-5 text-slate-400">
                    Connecting to external lighting allows SanctuaryOS to automatically coordinate house lights and stage fixtures with Atmosphere transitions.
                  </p>
                </div>
              </div>

              <button className="mt-6 flex w-full justify-center items-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-500 transition shadow-lg shadow-sky-600/20">
                <Save className="h-4 w-4" /> Save Configuration
              </button>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
