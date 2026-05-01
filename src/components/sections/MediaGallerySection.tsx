import Image from 'next/image';
import { mediaBoards } from '@/data/mediaBoards';
import { Card } from '@/components/ui/Card';
import { SectionTitle } from '@/components/ui/SectionTitle';

export function MediaGallerySection() {
  return (
    <section className="mt-16">
      <Card className="p-6 md:p-7">
        <SectionTitle
          eyebrow="Church visual mockups"
          title="The image boards this demo is designed to showcase"
          description="These are already wired into the codebase so you can open the project and immediately see the mockup visuals."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {mediaBoards.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-[24px] border border-white/10 bg-slate-900/70">
              <div className="aspect-[4/3] border-b border-white/10">
                <Image src={item.imageSrc} alt={item.title} width={1536} height={1024} className="h-full w-full object-cover" />
              </div>
              <div className="p-5">
                <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-sky-200">{item.tag}</div>
                <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.caption}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
