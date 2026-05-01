import type { Metadata } from 'next';
import { AudioStation } from '@/components/ops/AudioStation';

export const metadata: Metadata = {
  title: 'SanctuaryOS | Audio Station',
  description: 'Full SONUS mixer for live audio engineering.',
};

export default function AudioPage() {
  return <AudioStation />;
}
