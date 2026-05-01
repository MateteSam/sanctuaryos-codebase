import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-3xl flex-col items-start px-5 py-24 md:px-8">
        <p className="rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-sm font-medium text-sky-200">404</p>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight md:text-5xl">This page does not exist.</h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">The route you tried to open is not available in this SanctuaryOS prototype yet.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="rounded-2xl bg-sky-400 px-5 py-3 font-medium text-slate-950">Go to Overview</Link>
          <Link href="/live" className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-medium text-slate-100">Open Live Mode</Link>
        </div>
      </div>
    </div>
  );
}
