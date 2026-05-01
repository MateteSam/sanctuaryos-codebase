'use client';

import Image from 'next/image';
import { ArrowRight, Check, CheckCircle2 } from 'lucide-react';
import { workflowSteps } from '@/data/workflowSteps';
import { Card } from '@/components/ui/Card';
import { SectionTitle } from '@/components/ui/SectionTitle';

export function HowItWorksSection({
  activeStep,
  onSelectStep,
}: {
  activeStep: number;
  onSelectStep: (id: number) => void;
}) {
  const currentStep = workflowSteps.find((step) => step.id === activeStep) ?? workflowSteps[0];
  const Icon = currentStep.icon;

  return (
    <section className="mt-16">
      <Card className="overflow-hidden p-0">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          <div className="border-r border-white/10 p-6 md:p-8">
            <SectionTitle
              eyebrow="Church workflow demo"
              title="Step by step: how SanctuaryOS would work in a church"
              description="From room scan to live worship to cloud sync."
            />
            <div className="mt-6 space-y-3">
              {workflowSteps.map((step) => {
                const StepIcon = step.icon;
                return (
                  <button key={step.id} onClick={() => onSelectStep(step.id)} className={`w-full rounded-2xl border px-4 py-4 text-left transition ${activeStep === step.id ? 'border-sky-400/50 bg-sky-400/10' : 'border-white/10 bg-slate-900/70 hover:bg-white/10'}`}>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10"><StepIcon className="h-4 w-4" /></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Step {step.id}</span>
                          {activeStep === step.id ? <Check className="h-3.5 w-3.5 text-sky-300" /> : null}
                        </div>
                        <p className="mt-1 font-medium text-slate-100">{step.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-400">{step.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="p-6 md:p-8">
            <div className="rounded-[28px] border border-white/10 bg-slate-900/80 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-400">Active church step</p>
                  <h3 className="mt-1 text-2xl font-semibold">{currentStep.title}</h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300"><Icon className="h-5 w-5" /></div>
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="overflow-hidden rounded-[24px] border border-white/10 bg-black/20">
                  <Image src="/demo/church-workflow-board.png" alt="SanctuaryOS workflow in churches" width={1024} height={1792} className="h-full w-full object-cover" />
                </div>
                <div className="space-y-4">
                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">What happens here</p>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{currentStep.description}</p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">User action</p>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-sky-400 px-4 py-2 text-sm font-medium text-slate-950">Continue demo <ArrowRight className="h-4 w-4" /></div>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Outcome</p>
                    <div className="mt-3 space-y-2">
                      {['Less manual setup', 'Cleaner volunteer workflow', 'Consistent room experience'].map((item) => (
                        <div key={item} className="flex items-center gap-2 text-sm text-slate-300"><CheckCircle2 className="h-4 w-4 text-emerald-300" />{item}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
}
