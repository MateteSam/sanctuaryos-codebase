import type { Metadata } from 'next';
import { DirectorStation } from '@/components/ops/DirectorStation';

export const metadata: Metadata = {
  title: 'SanctuaryOS | Director Station',
  description: 'Camera switching, transitions, and live broadcast control.',
};

export default function DirectorPage() {
  return <DirectorStation />;
}
