import type { Stat } from '@/types/sanctuary';
import { StatCard } from '@/components/ui/StatCard';

export function StatsGrid({ stats }: { stats: Stat[] }) {
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}
