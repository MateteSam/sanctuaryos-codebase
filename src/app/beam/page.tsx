import type { Metadata } from 'next';
import { BeamClient } from '@/components/beam/BeamClient';

export const metadata: Metadata = {
  title: 'SanctuaryOS | Beam Output',
  description: 'Full-screen holographic projection output.',
};

export default function BeamPage() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-black text-white">
      <BeamClient />
    </main>
  );
}
