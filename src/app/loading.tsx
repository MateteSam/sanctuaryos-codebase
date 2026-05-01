export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 md:px-8">
        <div className="h-16 animate-pulse rounded-[28px] border border-white/10 bg-white/5" />
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="h-[360px] animate-pulse rounded-[28px] border border-white/10 bg-white/5" />
          <div className="h-[360px] animate-pulse rounded-[28px] border border-white/10 bg-white/5" />
        </div>
      </div>
    </div>
  );
}
