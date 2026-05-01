'use client';

import { Check } from 'lucide-react';
import { demoScenes } from '@/data/demoScenes';
import { Card } from '@/components/ui/Card';
import { SectionTitle } from '@/components/ui/SectionTitle';

export function AtmosphereStudio({
  selectedSceneId,
  onSelectScene,
}: {
  selectedSceneId: string;
  onSelectScene: (id: string) => void;
}) {
  const activeScene = demoScenes.find((scene) => scene.id === selectedSceneId) ?? demoScenes[0];

  return (
    <section className="mt-16">
      <Card className="overflow-hidden p-0">
        <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
          <div className="border-r border-white/10 p-6 md:p-8">
            <SectionTitle
              eyebrow="Atmosphere demo"
              title="Preview the room feeling before the service starts"
              description="These scene directions show how SanctuaryOS can shift the mood of a church environment in seconds."
            />
            <div className="mt-6 space-y-3">
              {demoScenes.map((scene) => (
                <button key={scene.id} onClick={() => onSelectScene(scene.id)} className={`w-full rounded-2xl border px-4 py-4 text-left transition ${selectedSceneId === scene.id ? 'border-sky-400/50 bg-sky-400/10' : 'border-white/10 bg-slate-900/70 hover:bg-white/10'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-100">{scene.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-400">{scene.subtitle}</p>
                    </div>
                    {selectedSceneId === scene.id ? <Check className="h-4 w-4 text-sky-300" /> : null}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="p-6 md:p-8">
            <div className={`relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br ${activeScene.palette} p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">Live room preview</p>
                  <h3 className="mt-2 text-2xl font-semibold">{activeScene.title}</h3>
                </div>
                <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-slate-100">{activeScene.mode}</div>
              </div>
              <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-4">
                <div className="relative min-h-[320px] overflow-hidden rounded-[22px] border border-white/10 bg-slate-950/40">
                  <div className="absolute inset-x-10 top-6 h-16 rounded-full bg-white/10 blur-2xl" />
                  <div className="absolute inset-x-8 bottom-8 h-20 rounded-full bg-sky-400/20 blur-2xl" />
                  <div className="absolute inset-x-6 top-12 h-28 rounded-[28px] border border-white/10 bg-white/5" />
                  <div className="absolute inset-x-10 bottom-10 h-36 rounded-[28px] border border-white/10 bg-white/5" />
                  <div className="absolute left-1/2 top-16 h-36 w-1 -translate-x-1/2 bg-white/20" />
                  <div className="absolute bottom-16 left-1/2 -translate-x-1/2 rounded-2xl border border-white/15 bg-black/30 px-5 py-3 text-center text-sm font-medium tracking-wide text-slate-100 shadow-lg">{activeScene.verse}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
