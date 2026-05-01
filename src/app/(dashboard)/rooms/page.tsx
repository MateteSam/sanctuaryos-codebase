import type { Metadata } from 'next';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { RoomsView } from '@/components/sections/RoomsView';

export const metadata: Metadata = {
  title: 'SanctuaryOS | Rooms',
  description: 'Organize room profiles, beam assignments, and environment settings.',
};

export default function RoomsPage() {
  return (
    <DashboardShell title="Rooms" description="Organize room profiles, beam assignments, and environment settings.">
      <RoomsView />
    </DashboardShell>
  );
}
