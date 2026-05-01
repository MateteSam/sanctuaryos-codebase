/**
 * Multi-Operator Station System — Type Definitions
 *
 * Defines the station types, metadata, and shared interfaces
 * for the network-based multi-operator architecture.
 */

// ── Station identifiers ──────────────────────────────────────────────────────
export type OperatorStation = 'director' | 'slides' | 'audio' | 'switch' | 'mix' | 'master';

// ── Station metadata for UI rendering ────────────────────────────────────────
export interface StationMeta {
  id: OperatorStation;
  name: string;
  description: string;
  icon: string;          // Lucide icon name
  accentColor: string;   // Hex color for station branding
  path: string;          // Route path
  shortcut: string;      // Keyboard shortcut hint
}

export const STATIONS: StationMeta[] = [
  {
    id: 'director',
    name: 'Director',
    description: 'Camera switching, transitions, program/preview monitors, and GO LIVE control.',
    icon: 'Clapperboard',
    accentColor: '#EF4444',
    path: '/ops/director',
    shortcut: 'D',
  },
  {
    id: 'slides',
    name: 'Slides & Graphics',
    description: 'Lyrics, Bible verses, lower thirds, overlays, and atmosphere control.',
    icon: 'Layers',
    accentColor: '#0EA5E9',
    path: '/ops/slides',
    shortcut: 'S',
  },
  {
    id: 'audio',
    name: 'Audio Engineer',
    description: 'Full SONUS mixer — channel strips, buses, EQ, effects, and monitoring.',
    icon: 'SlidersHorizontal',
    accentColor: '#A855F7',
    path: '/ops/audio',
    shortcut: 'A',
  },
  {
    id: 'switch',
    name: 'Phone Switcher',
    description: 'Touch-native camera switching from your phone. Cut, fade, and send cues on the go.',
    icon: 'Smartphone',
    accentColor: '#22C55E',
    path: '/ops/switch',
    shortcut: 'W',
  },
  {
    id: 'mix',
    name: 'Phone Mixer',
    description: 'Walk the room and mix audio from your phone. Horizontal faders, ring-out mode.',
    icon: 'Music',
    accentColor: '#F59E0B',
    path: '/ops/mix',
    shortcut: 'X',
  },
  {
    id: 'master',
    name: 'Master Console',
    description: 'Full control of all broadcast systems in a single interface.',
    icon: 'Monitor',
    accentColor: '#64748B',
    path: '/app',
    shortcut: 'M',
  },
];

// ── Operator presence ────────────────────────────────────────────────────────
export interface OperatorPresence {
  station: OperatorStation;
  connectedAt: number;
  lastHeartbeat: number;
}
