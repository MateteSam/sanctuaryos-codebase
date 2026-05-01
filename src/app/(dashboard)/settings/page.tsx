import type { Metadata } from 'next';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { SettingsView } from '@/components/sections/SettingsView';

export const metadata: Metadata = {
  title: 'SanctuaryOS | Settings',
  description: 'Control admin preferences, devices, and platform defaults.',
};

export default function SettingsPage() {
  return (
    <DashboardShell title="Settings" description="Control admin preferences, devices, and platform defaults.">
      <SettingsView />
    </DashboardShell>
  );
}
