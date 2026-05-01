'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { StatsGrid } from '@/components/ui/StatsGrid';
import type { Stat } from '@/types/sanctuary';

export function HeroSection({
  stats,
  onJumpToLive,
  onJumpToAtmosphere,
  onJumpToMedia,
}: {
  stats: Stat[];
  onJumpToLive: () => void;
  onJumpToAtmosphere: () => void;
  onJumpToMedia: () => void;
}) {
  return (
    <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <Card className="overflow-hidden p-0">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="p-7 md:p-10">
            <p className="text-sm font-medium text-sky-300">SanctuaryOS demo</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
              A church can scan the room, launch atmosphere, and run worship from one system.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
              This demo focuses on the clearest pitch flow first: the product vision, the live control experience,
              the atmosphere preview, and the step-by-step church workflow.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={onJumpToLive} className="rounded-2xl bg-sky-400 px-5 py-3 font-medium text-slate-950">Jump to Live Demo</button>
              <button onClick={onJumpToAtmosphere} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-medium text-slate-100">Preview Atmospheres</button>
              <button onClick={onJumpToMedia} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-medium text-slate-100">See Church Mockups</button>
            </div>

            <StatsGrid stats={stats} />
          </div>

          <div className="border-l border-white/10 p-7 md:p-10">
            <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-950 via-sky-950 to-violet-950 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">What the room feels like</p>
                  <h3 className="mt-1 text-2xl font-semibold">Immersive worship atmosphere</h3>
                </div>
                <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-slate-100">Demo preview</div>
              </div>

              <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-4">
                <div className="relative min-h-[320px] overflow-hidden rounded-[22px] border border-white/10 bg-slate-950/40">
                  <div className="absolute inset-x-10 top-6 h-16 rounded-full bg-white/10 blur-2xl" />
                  <div className="absolute inset-x-8 bottom-8 h-20 rounded-full bg-sky-400/20 blur-2xl" />
                  <div className="absolute inset-x-6 top-12 h-28 rounded-[28px] border border-white/10 bg-white/5" />
                  <div className="absolute inset-x-10 bottom-10 h-36 rounded-[28px] border border-white/10 bg-white/5" />
                  <div className="absolute left-1/2 top-16 h-36 w-1 -translate-x-1/2 bg-white/20" />
                  <div className="absolute bottom-16 left-1/2 -translate-x-1/2 rounded-2xl border border-white/15 bg-black/30 px-5 py-3 text-center text-sm font-medium tracking-wide text-slate-100 shadow-lg">
                    Be still and know
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.section>
  );
}
