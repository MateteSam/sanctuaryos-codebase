'use client';

import { motion } from 'framer-motion';
import { Battery, Wifi, Maximize, ScanLine, Cuboid, Eye, Layers } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { SectionTitle } from '@/components/ui/SectionTitle';

const devices = [
  { id: 'beam-01', name: 'Sanctuary Beam Pro - Left Stage', battery: 92, wifi: 'Excellent', mode: 'Volumetric', active: true },
  { id: 'beam-02', name: 'Sanctuary Beam Pro - Right Stage', battery: 88, wifi: 'Excellent', mode: 'Volumetric', active: true },
  { id: 'beam-03', name: 'Sanctuary Beam Core - Center', battery: 100, wifi: 'Good', mode: 'Mesh-Based', active: true },
];

export function DeviceHub() {
  return (
    <section>
      <Card className="p-6 md:p-7">
        <SectionTitle
          eyebrow="Sovereign Hardware"
          title="Device Hub"
          description="Manage and monitor your fleet of wireless Sanctuary Beams. Seamlessly switch between holographic projection modes."
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            {devices.map((device) => (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-slate-900/50 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h4 className="font-medium text-slate-200">{device.name}</h4>
                  <p className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Battery className="h-3 w-3" /> {device.battery}%</span>
                    <span className="flex items-center gap-1"><Wifi className="h-3 w-3" /> {device.wifi}</span>
                    <span className="flex items-center gap-1"><Maximize className="h-3 w-3" /> {device.mode}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition">
                    Configure
                  </button>
                  <button className="rounded-xl bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition">
                    Sync
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-950/40 to-slate-900/60 p-5">
              <h4 className="mb-4 text-sm font-medium text-slate-300">Triple-Mode Projection</h4>
              
              <div className="grid gap-3">
                <div className="flex items-start gap-4 rounded-xl bg-white/5 p-3 hover:bg-white/10 transition cursor-pointer">
                  <Layers className="mt-1 h-5 w-5 text-indigo-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">Mesh-Based</p>
                    <p className="text-xs text-slate-400">High-fidelity floating holograms via Nano-Mesh.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-xl border border-sky-500/30 bg-sky-900/20 p-3 hover:bg-sky-900/40 transition cursor-pointer">
                  <Cuboid className="mt-1 h-5 w-5 text-sky-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">Volumetric</p>
                    <p className="text-xs text-sky-200/70">True mid-air projection using fast laser scan.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-xl bg-white/5 p-3 hover:bg-white/10 transition cursor-pointer">
                  <Eye className="mt-1 h-5 w-5 text-amber-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">Physical Wall</p>
                    <p className="text-xs text-slate-400">Architectural skinning and mapping.</p>
                  </div>
                </div>
              </div>
            </div>

            <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white text-slate-950 px-4 py-3 text-sm font-semibold hover:bg-slate-200 transition">
              <ScanLine className="h-4 w-4" />
              Discover New Beams
            </button>
          </div>
        </div>
      </Card>
    </section>
  );
}
