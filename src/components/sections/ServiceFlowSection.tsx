import { setItems } from '@/data/setItems';
import { Card } from '@/components/ui/Card';
import { SectionTitle } from '@/components/ui/SectionTitle';

export function ServiceFlowSection({ activeIndex = 0 }: { activeIndex?: number }) {
  return (
    <Card className="p-6 md:p-7">
      <SectionTitle
        eyebrow="Live worship demo"
        title="A service flow that stays flexible"
        description="A simplified set builder view to show how operators move through songs, scripture, and atmosphere scenes."
      />
      <div className="mt-6 space-y-3">
        {setItems.map((item, index) => (
          <div key={`${item.title}-${item.length}`} className={`flex items-center justify-between rounded-2xl border px-4 py-4 ${activeIndex === index ? 'border-sky-400/50 bg-sky-400/10' : 'border-white/10 bg-slate-900/70'}`}>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.type}</p>
              <p className="mt-1 font-medium text-slate-100">{item.title}</p>
            </div>
            <div className="text-sm text-slate-400">{item.length}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
