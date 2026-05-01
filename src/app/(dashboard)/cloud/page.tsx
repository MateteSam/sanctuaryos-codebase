import type { Metadata } from 'next';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { CloudView } from '@/components/sections/CloudView';

export const metadata: Metadata = {
  title: 'SanctuaryOS | Cloud',
  description: 'Manage synced rooms, campuses, and connected environments.',
};

export default function CloudPage() {
  return (
    <DashboardShell title="Cloud" description="Manage synced rooms, campuses, and connected environments.">
      <CloudView />
    </DashboardShell>
  );
}
