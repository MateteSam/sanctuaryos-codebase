import { Cloud, Radio, ScanLine, Settings, Building2, ArrowLeft } from 'lucide-react';
import type { DashboardNavItem } from '@/types/sanctuary';

export const dashboardNavItems: DashboardNavItem[] = [
  { href: '/app',          label: 'Live Control',  icon: Radio },
  { href: '/mapping',      label: 'Room Mapping',  icon: ScanLine },
  { href: '/rooms',        label: 'Rooms',         icon: Building2 },
  { href: '/cloud',        label: 'Cloud',         icon: Cloud },
  { href: '/settings',     label: 'Settings',      icon: Settings },
  { href: '/',             label: 'Marketing Site', icon: ArrowLeft },
];
