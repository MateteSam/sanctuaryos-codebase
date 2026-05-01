import { ScanLine, Layers, Cuboid, Eye, RefreshCcw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { SectionTitle } from '@/components/ui/SectionTitle';

export function MappingView({ selectedRoom }: { selectedRoom: string }) {
  return (
    <section>
      <Card className="p-6 md:p-7">
        <SectionTitle
          eyebrow="Sanctuary Map"
          title={`Room scanning and mapping for ${selectedRoom}`}
          description="This view represents the projection intelligence layer: room scanning, surface detection, and beam alignment."
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[24px] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 p-6 flex flex-col justify-between">
            <div className="flex h-[240px] items-center justify-center rounded-[20px] border border-dashed border-sky-400/30 bg-white/5 text-center text-slate-300 relative overflow-hidden">
               {/* Simulating a scanning animation */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-sky-500/10 to-transparent w-full h-[200%] animate-[scan_3s_ease-in-out_infinite]" />
              <div className="relative z-10">
                <ScanLine className="mx-auto h-10 w-10 text-sky-300 animate-pulse" />
                <p className="mt-4 text-lg font-medium">LiDAR Room Scan Active</p>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-400 px-4">
                  Detecting surfaces and calculating optimum holographic overlap points for Sanctuary Beams.
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
               <div className="rounded-xl bg-slate-950 p-3 text-center border border-white/5">
                 <Layers className="mx-auto h-5 w-5 text-indigo-400" />
                 <p className="mt-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Mesh-Ready</p>
               </div>
               <div className="rounded-xl bg-slate-950 p-3 text-center border border-sky-500/20 shadow-[0_0_15px_rgba(14,165,233,0.15)] relative">
                 <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
                 <Cuboid className="mx-auto h-5 w-5 text-sky-400" />
                 <p className="mt-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Volumetric Zone</p>
               </div>
               <div className="rounded-xl bg-slate-950 p-3 text-center border border-white/5">
                 <Eye className="mx-auto h-5 w-5 text-amber-400" />
                 <p className="mt-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Wall Mapping</p>
               </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
               <RefreshCcw className="h-4 w-4" /> Beam Alignment Status
            </h4>
            {[
              { text: 'Sanctuary Beam Pro (Left Stage) connected', status: 'active' },
              { text: 'Sanctuary Beam Pro (Right Stage) connected', status: 'active' },
              { text: 'Nano-Mesh anchor points detected', status: 'ready' },
              { text: 'Volumetric overlap zones calibrated', status: 'active' },
              { text: 'Physical wall skinning mapped', status: 'ready' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 rounded-2xl bg-slate-900/80 p-4 text-sm leading-6 text-slate-200">
                <div className={`h-2 w-2 rounded-full ${item.status === 'active' ? 'bg-emerald-400 shadow-[0_0_8px_theme(colors.emerald.400)]' : 'bg-slate-500'}`} />
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </section>
  );
}
