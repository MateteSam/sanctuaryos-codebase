import type { DemoScene } from '@/types/sanctuary';

export const demoScenes: DemoScene[] = [
  {
    id: 'prayer',
    title: 'Prayer Atmosphere',
    subtitle: 'Quiet blue light wrap with soft motion and minimal lyrics.',
    palette: 'from-sky-950 via-blue-900 to-indigo-950',
    verse: 'Be still and know',
    mode: 'Prayer Night',
  },
  {
    id: 'revival',
    title: 'Revival Night',
    subtitle: 'Warmer stage energy with brighter movement and stronger contrast.',
    palette: 'from-orange-950 via-rose-900 to-fuchsia-950',
    verse: 'Let heaven open',
    mode: 'High Energy',
  },
  {
    id: 'scripture',
    title: 'Scripture Glow',
    subtitle: 'Elegant reading mode for projected scripture with ambient room edges.',
    palette: 'from-violet-950 via-indigo-950 to-sky-950',
    verse: 'Psalm 24:7–10',
    mode: 'Reading Mode',
  },
  {
    id: 'communion',
    title: 'Communion Light',
    subtitle: 'Soft gold and blue wash designed for reflective service moments.',
    palette: 'from-amber-950 via-yellow-900/70 to-slate-950',
    verse: 'Remember Me',
    mode: 'Reflective',
  },
];
