import type { Stat } from '@/types/sanctuary';

export function StatCard({ label, value, icon: Icon }: Stat) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
        <Icon className="h-4 w-4 text-sky-300" />
      </div>
      <p className="mt-4 text-lg font-semibold text-slate-100">{value}</p>
    </div>
  );
}
