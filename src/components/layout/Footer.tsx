import { Cloud, Music4 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-12 pb-6 text-sm text-slate-400">
      <div className="flex flex-col gap-3 rounded-[28px] border border-white/10 bg-white/5 px-5 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-medium text-slate-200">SanctuaryOS demo codebase</p>
          <p className="mt-1">Portable Next.js prototype built for easy handoff into VS Code and other coding spaces.</p>
        </div>
        <div className="flex items-center gap-4 text-slate-300">
          <div className="inline-flex items-center gap-2"><Music4 className="h-4 w-4" /> Worship-first</div>
          <div className="inline-flex items-center gap-2"><Cloud className="h-4 w-4" /> Cloud-ready</div>
        </div>
      </div>
    </footer>
  );
}
