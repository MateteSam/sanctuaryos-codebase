import type { Metadata } from 'next';
import { StageClient } from '@/components/stage/StageClient';

export const metadata: Metadata = {
  title: 'SanctuaryOS | Stage',
  description: 'Stage confidence monitor.',
};

export default function StagePage() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-black text-white">
      <StageClient />
    </main>
  );
}
