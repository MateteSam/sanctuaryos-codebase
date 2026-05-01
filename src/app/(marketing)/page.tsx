import type { Metadata } from 'next';
import { OverviewContent } from '@/components/sections/OverviewContent';

export const metadata: Metadata = {
  title: 'SanctuaryOS | Overview',
  description: 'Explore the SanctuaryOS vision: immersive worship visuals, room intelligence, and cloud-connected ministry workflows.',
};

export default function HomePage() {
  return <OverviewContent />;
}
