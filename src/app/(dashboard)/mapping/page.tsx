import type { Metadata } from 'next';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { MappingView } from '@/components/sections/MappingView';
import { rooms } from '@/data/rooms';

export const metadata: Metadata = {
  title: 'SanctuaryOS | Mapping',
  description: 'Scan rooms, align projection surfaces, and preview spatial setup.',
};

export default function MappingPage() {
  return (
    <DashboardShell title="Mapping" description="Scan rooms, align projection surfaces, and preview spatial setup.">
      <MappingView selectedRoom={rooms[0].name} />
    </DashboardShell>
  );
}
