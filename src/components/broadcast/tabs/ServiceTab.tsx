'use client';

import { ServiceFlow } from '@/components/sections/ServiceFlow';
import { type ManagedCamera } from '@/lib/useCameraManager';
import { type AtmospherePreset } from '@/data/atmospheres';
import { type AnyServiceSlide } from '@/data/serviceTemplates';
import { type SlideData } from '@/data/lyrics';

interface Props {
  activeAtmos: AtmospherePreset;
  cameras: ManagedCamera[];
  onProgramCut: (camId: string) => void;
  onPushState: (patch: Record<string, any>, immediate?: boolean) => void;
}

export function ServiceTab({ activeAtmos, cameras, onProgramCut, onPushState }: Props) {
  const handlePushSlide = (slide: AnyServiceSlide) => {
    // Auto camera cut
    if (slide.cameraCue) {
      const cue = slide.cameraCue.toLowerCase();
      const cam = cameras.find(c => c.name.toLowerCase().includes(cue) || c.id.toLowerCase().includes(cue));
      if (cam) onProgramCut(cam.id);
    }

    // State push
    if (slide.type === 'announcement') {
      const s = slide as any;
      onPushState({ activeSlide: { id: s.id, type: 'lyric', title: s.title, content: s.body }, activeOverlay: null }, true);
    } else if (slide.type === 'prayer_point') {
      const s = slide as any;
      const content = (s.points as string[]).map((p: string, i: number) => `${i + 1}. ${p}`).join('\n');
      onPushState({ activeSlide: { id: s.id, type: 'lyric', title: s.title, content }, activeOverlay: null }, true);
    } else if (slide.type === 'sermon_outline') {
      const s = slide as any;
      const content = (s.points as any[]).map((p: any) => p.heading).join('\n');
      onPushState({ activeSlide: { id: s.id, type: 'lyric', title: s.topic || s.title, content }, activeOverlay: null }, true);
    } else if (slide.type === 'countdown') {
      onPushState({ activeOverlay: 'countdown', countdownEndTime: (slide as any).endTime, countdownMessage: (slide as any).message }, true);
    } else if (slide.type === 'blank' || slide.type === 'break') {
      onPushState({ activeOverlay: 'break' }, true);
    } else if (slide.type === 'sting' && (slide as any).videoUrl) {
      onPushState({ atmosVideoUrl: (slide as any).videoUrl, activeOverlay: null }, true);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <ServiceFlow accentColor={activeAtmos.accentColor} onPushSlide={handlePushSlide} />
    </div>
  );
}
