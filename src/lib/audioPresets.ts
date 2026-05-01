'use client';

// ── SONUS Audio Preset Library ────────────────────────────────────────────────
// Professional DSP presets for every instrument in a church worship band.
// Each preset controls the FULL signal chain: HPF, 4-band EQ, gate, compressor,
// de-esser, and FX send levels.

export type PresetCategory = 'vocals' | 'instruments' | 'percussion' | 'ambient' | 'utility';

export interface AudioPresetFull {
  id: string;
  name: string;
  category: PresetCategory;
  description: string;
  icon: string;           // Lucide icon name
  hpfFreq: number;        // High-pass filter frequency (Hz)
  eq: {
    low:     { freq: number; gain: number }; // Low shelf
    lowMid:  { freq: number; gain: number; q: number }; // Peaking
    highMid: { freq: number; gain: number; q: number }; // Peaking
    high:    { freq: number; gain: number }; // High shelf
  };
  gate: { enabled: boolean; threshold: number };   // threshold: 0..1 (signal level)
  comp: { enabled: boolean; threshold: number; ratio: number; attack: number; release: number };
  deEsser: { enabled: boolean; freq: number; threshold: number };
  fxSends: { reverb: number; delay: number };      // 0..1
}

export const SONUS_PRESETS: AudioPresetFull[] = [
  // ── VOCALS ──────────────────────────────────────────────────────────────────
  {
    id: 'worship_leader', name: 'Worship Leader', category: 'vocals',
    description: 'Clear, present vocal with warmth for leading worship.',
    icon: 'Mic', hpfFreq: 100,
    eq: {
      low:     { freq: 200, gain: -2 },
      lowMid:  { freq: 400, gain: -3, q: 1.8 },
      highMid: { freq: 3500, gain: 3, q: 1.2 },
      high:    { freq: 10000, gain: 2 },
    },
    gate: { enabled: true, threshold: 0.03 },
    comp: { enabled: true, threshold: -18, ratio: 4, attack: 0.005, release: 0.1 },
    deEsser: { enabled: true, freq: 6500, threshold: -20 },
    fxSends: { reverb: 0.25, delay: 0.05 },
  },
  {
    id: 'backing_vocal', name: 'Backing Vocal', category: 'vocals',
    description: 'Sits behind the lead, blends smoothly with the team.',
    icon: 'Users', hpfFreq: 120,
    eq: {
      low:     { freq: 200, gain: -3 },
      lowMid:  { freq: 500, gain: -2, q: 2.0 },
      highMid: { freq: 3000, gain: 1, q: 1.4 },
      high:    { freq: 8000, gain: 1 },
    },
    gate: { enabled: true, threshold: 0.04 },
    comp: { enabled: true, threshold: -16, ratio: 3, attack: 0.008, release: 0.12 },
    deEsser: { enabled: true, freq: 7000, threshold: -18 },
    fxSends: { reverb: 0.35, delay: 0.0 },
  },
  {
    id: 'spoken_word', name: 'Spoken Word', category: 'vocals',
    description: 'Maximum clarity for sermons and announcements.',
    icon: 'MessageCircle', hpfFreq: 80,
    eq: {
      low:     { freq: 200, gain: 0 },
      lowMid:  { freq: 350, gain: -2, q: 2.0 },
      highMid: { freq: 2500, gain: 2, q: 1.0 },
      high:    { freq: 8000, gain: 1 },
    },
    gate: { enabled: true, threshold: 0.05 },
    comp: { enabled: true, threshold: -14, ratio: 6, attack: 0.003, release: 0.08 },
    deEsser: { enabled: true, freq: 6000, threshold: -16 },
    fxSends: { reverb: 0.1, delay: 0.0 },
  },
  {
    id: 'choir', name: 'Choir', category: 'vocals',
    description: 'Captures the ensemble with air and body.',
    icon: 'Music2', hpfFreq: 80,
    eq: {
      low:     { freq: 250, gain: -1 },
      lowMid:  { freq: 600, gain: 0, q: 1.0 },
      highMid: { freq: 4000, gain: 2, q: 0.8 },
      high:    { freq: 12000, gain: 3 },
    },
    gate: { enabled: false, threshold: 0 },
    comp: { enabled: true, threshold: -20, ratio: 2, attack: 0.015, release: 0.2 },
    deEsser: { enabled: false, freq: 6000, threshold: -20 },
    fxSends: { reverb: 0.4, delay: 0.0 },
  },

  // ── INSTRUMENTS ─────────────────────────────────────────────────────────────
  {
    id: 'acoustic_guitar', name: 'Acoustic Guitar', category: 'instruments',
    description: 'Bright sparkle, cut the mud, sit in the mix.',
    icon: 'Guitar', hpfFreq: 120,
    eq: {
      low:     { freq: 200, gain: -3 },
      lowMid:  { freq: 400, gain: -4, q: 2.0 },
      highMid: { freq: 3000, gain: 2, q: 1.2 },
      high:    { freq: 10000, gain: 4 },
    },
    gate: { enabled: false, threshold: 0 },
    comp: { enabled: true, threshold: -20, ratio: 3, attack: 0.01, release: 0.15 },
    deEsser: { enabled: false, freq: 6000, threshold: -20 },
    fxSends: { reverb: 0.2, delay: 0.1 },
  },
  {
    id: 'electric_guitar', name: 'Electric Guitar', category: 'instruments',
    description: 'Tames amp harshness, adds body and clarity.',
    icon: 'Zap', hpfFreq: 80,
    eq: {
      low:     { freq: 150, gain: -1 },
      lowMid:  { freq: 500, gain: 1, q: 1.5 },
      highMid: { freq: 3500, gain: -2, q: 2.0 },
      high:    { freq: 8000, gain: 1 },
    },
    gate: { enabled: true, threshold: 0.02 },
    comp: { enabled: true, threshold: -16, ratio: 4, attack: 0.005, release: 0.1 },
    deEsser: { enabled: false, freq: 6000, threshold: -20 },
    fxSends: { reverb: 0.15, delay: 0.15 },
  },
  {
    id: 'bass_guitar', name: 'Bass Guitar', category: 'instruments',
    description: 'Tight low end, punchy attack, clean DI tone.',
    icon: 'Activity', hpfFreq: 40,
    eq: {
      low:     { freq: 80, gain: 2 },
      lowMid:  { freq: 250, gain: -3, q: 2.5 },
      highMid: { freq: 1200, gain: 2, q: 1.8 },
      high:    { freq: 5000, gain: -2 },
    },
    gate: { enabled: false, threshold: 0 },
    comp: { enabled: true, threshold: -14, ratio: 6, attack: 0.003, release: 0.08 },
    deEsser: { enabled: false, freq: 6000, threshold: -20 },
    fxSends: { reverb: 0.0, delay: 0.0 },
  },
  {
    id: 'keys', name: 'Keys / Piano', category: 'instruments',
    description: 'Full range clarity with controlled dynamics.',
    icon: 'Piano', hpfFreq: 60,
    eq: {
      low:     { freq: 150, gain: -1 },
      lowMid:  { freq: 400, gain: -2, q: 1.5 },
      highMid: { freq: 3000, gain: 1, q: 1.0 },
      high:    { freq: 10000, gain: 2 },
    },
    gate: { enabled: false, threshold: 0 },
    comp: { enabled: true, threshold: -18, ratio: 3, attack: 0.01, release: 0.15 },
    deEsser: { enabled: false, freq: 6000, threshold: -20 },
    fxSends: { reverb: 0.3, delay: 0.05 },
  },

  // ── PERCUSSION ──────────────────────────────────────────────────────────────
  {
    id: 'drums_kick', name: 'Kick Drum', category: 'percussion',
    description: 'Punchy chest-thumping kick with click attack.',
    icon: 'Circle', hpfFreq: 30,
    eq: {
      low:     { freq: 60, gain: 4 },
      lowMid:  { freq: 350, gain: -6, q: 3.0 },
      highMid: { freq: 3500, gain: 3, q: 2.0 },
      high:    { freq: 8000, gain: -2 },
    },
    gate: { enabled: true, threshold: 0.08 },
    comp: { enabled: true, threshold: -12, ratio: 6, attack: 0.002, release: 0.06 },
    deEsser: { enabled: false, freq: 6000, threshold: -20 },
    fxSends: { reverb: 0.0, delay: 0.0 },
  },
  {
    id: 'drums_snare', name: 'Snare Drum', category: 'percussion',
    description: 'Crisp crack with body, controlled ring.',
    icon: 'Disc', hpfFreq: 100,
    eq: {
      low:     { freq: 200, gain: 2 },
      lowMid:  { freq: 500, gain: -2, q: 2.0 },
      highMid: { freq: 4000, gain: 3, q: 1.5 },
      high:    { freq: 10000, gain: 1 },
    },
    gate: { enabled: true, threshold: 0.06 },
    comp: { enabled: true, threshold: -14, ratio: 4, attack: 0.001, release: 0.08 },
    deEsser: { enabled: false, freq: 6000, threshold: -20 },
    fxSends: { reverb: 0.15, delay: 0.0 },
  },
  {
    id: 'drums_oh', name: 'Drum Overheads', category: 'percussion',
    description: 'Cymbals and room capture, bright and airy.',
    icon: 'Sparkles', hpfFreq: 200,
    eq: {
      low:     { freq: 300, gain: -4 },
      lowMid:  { freq: 800, gain: -1, q: 1.0 },
      highMid: { freq: 5000, gain: 2, q: 0.8 },
      high:    { freq: 12000, gain: 3 },
    },
    gate: { enabled: false, threshold: 0 },
    comp: { enabled: true, threshold: -18, ratio: 2, attack: 0.015, release: 0.2 },
    deEsser: { enabled: false, freq: 6000, threshold: -20 },
    fxSends: { reverb: 0.1, delay: 0.0 },
  },

  // ── AMBIENT ─────────────────────────────────────────────────────────────────
  {
    id: 'congregation', name: 'Congregation Mic', category: 'ambient',
    description: 'Room ambience for broadcast — captures the worship atmosphere.',
    icon: 'Users2', hpfFreq: 150,
    eq: {
      low:     { freq: 250, gain: -4 },
      lowMid:  { freq: 600, gain: -2, q: 1.5 },
      highMid: { freq: 3000, gain: 1, q: 0.8 },
      high:    { freq: 10000, gain: 3 },
    },
    gate: { enabled: false, threshold: 0 },
    comp: { enabled: true, threshold: -22, ratio: 2, attack: 0.02, release: 0.3 },
    deEsser: { enabled: false, freq: 6000, threshold: -20 },
    fxSends: { reverb: 0.0, delay: 0.0 },
  },
  {
    id: 'backing_track', name: 'Backing Track', category: 'ambient',
    description: 'Pre-mixed stems — minimal processing, just level control.',
    icon: 'Disc3', hpfFreq: 20,
    eq: {
      low:     { freq: 200, gain: 0 },
      lowMid:  { freq: 500, gain: 0, q: 1.0 },
      highMid: { freq: 3000, gain: 0, q: 1.0 },
      high:    { freq: 10000, gain: 0 },
    },
    gate: { enabled: false, threshold: 0 },
    comp: { enabled: false, threshold: -20, ratio: 1, attack: 0.01, release: 0.1 },
    deEsser: { enabled: false, freq: 6000, threshold: -20 },
    fxSends: { reverb: 0.0, delay: 0.0 },
  },

  // ── UTILITY ─────────────────────────────────────────────────────────────────
  {
    id: 'flat', name: 'Flat (Bypass)', category: 'utility',
    description: 'No processing — raw input passthrough.',
    icon: 'Minus', hpfFreq: 20,
    eq: {
      low:     { freq: 200, gain: 0 },
      lowMid:  { freq: 500, gain: 0, q: 1.0 },
      highMid: { freq: 3000, gain: 0, q: 1.0 },
      high:    { freq: 10000, gain: 0 },
    },
    gate: { enabled: false, threshold: 0 },
    comp: { enabled: false, threshold: 0, ratio: 1, attack: 0.01, release: 0.1 },
    deEsser: { enabled: false, freq: 6000, threshold: -20 },
    fxSends: { reverb: 0.0, delay: 0.0 },
  },
];

export const PRESET_CATEGORIES: { id: PresetCategory; label: string; color: string }[] = [
  { id: 'vocals',      label: 'Vocals',      color: '#f0c14b' },
  { id: 'instruments',  label: 'Instruments',  color: '#4ade80' },
  { id: 'percussion',   label: 'Percussion',   color: '#22d3ee' },
  { id: 'ambient',      label: 'Ambient',      color: '#a855f7' },
  { id: 'utility',      label: 'Utility',      color: '#64748b' },
];

export function getPresetsByCategory(cat: PresetCategory): AudioPresetFull[] {
  return SONUS_PRESETS.filter(p => p.category === cat);
}

// ── Scene Snapshot Types ──────────────────────────────────────────────────────
export interface SceneSnapshot {
  id: string;
  name: string;
  timestamp: number;
  channels: Record<string, {
    volume: number; muted: boolean; eq: any; sends: Record<string, number>;
    preAmpGain: number; gateEnabled: boolean; compEnabled: boolean; presetId?: string;
  }>;
  buses: Record<string, { masterLevel: number; muted: boolean }>;
}

export const DEFAULT_SCENES: { id: string; name: string; icon: string }[] = [
  { id: 'soundcheck', name: 'Soundcheck', icon: 'Wrench' },
  { id: 'worship',    name: 'Worship',    icon: 'Music' },
  { id: 'sermon',     name: 'Sermon',     icon: 'BookOpen' },
  { id: 'altar',      name: 'Altar Call',  icon: 'Heart' },
  { id: 'broadcast',  name: 'Broadcast',  icon: 'Radio' },
];
