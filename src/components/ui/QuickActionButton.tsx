import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function QuickActionButton({
  children,
  icon: Icon,
  onClick,
}: {
  children: ReactNode;
  icon: LucideIcon;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-left text-sm transition hover:bg-white/15"
    >
      {children}
      <Icon className="h-4 w-4" />
    </button>
  );
}
