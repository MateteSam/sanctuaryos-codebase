import type { Metadata } from 'next';
import { SlidesStation } from '@/components/ops/SlidesStation';

export const metadata: Metadata = {
  title: 'SanctuaryOS | Slides Station',
  description: 'Lyrics, Bible verses, lower thirds, and atmosphere control.',
};

export default function SlidesPage() {
  return <SlidesStation />;
}
