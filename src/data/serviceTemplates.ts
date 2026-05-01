// ─── Service Templates ─────────────────────────────────────────────────────────

export type ServiceSlideType =
  | 'lyric'
  | 'scripture'
  | 'sting'
  | 'countdown'
  | 'announcement'
  | 'prayer_point'
  | 'sermon_outline'
  | 'slideshow'
  | 'blank'
  | 'break';

export interface BaseSlide {
  id: string;
  type: ServiceSlideType;
  title: string;
  label?: string;
  durationMs?: number;
  cameraCue?: string;
}

export interface CountdownSlide extends BaseSlide {
  type: 'countdown';
  endTime: number;        // epoch ms — computed at load time
  message: string;
  durationMs?: number;    // kept for template definitions
}

export interface AnnouncementSlide extends BaseSlide {
  type: 'announcement';
  body: string;
  imageUrl?: string;
}

export interface PrayerSlide extends BaseSlide {
  type: 'prayer_point';
  points: string[];
}

export interface SermonOutlineSlide extends BaseSlide {
  type: 'sermon_outline';
  topic: string;
  points: { heading: string; sub?: string; scripture?: string }[];
  preacher?: string;
}

export interface SlideshowSlide extends BaseSlide {
  type: 'slideshow';
  images: { url: string; caption?: string }[];
  intervalSec: number;
}

export interface StingSlide extends BaseSlide {
  type: 'sting';
  videoUrl?: string;
  style: 'opening' | 'closing' | 'transition' | 'bumper';
}

export interface BlankSlide extends BaseSlide {
  type: 'blank' | 'break';
}

export type AnyServiceSlide =
  | BaseSlide | CountdownSlide | AnnouncementSlide
  | PrayerSlide | SermonOutlineSlide | SlideshowSlide | StingSlide | BlankSlide;

// ─── Type metadata (icon is a Lucide icon NAME string, not an emoji) ──────────
export const SLIDE_TYPE_META: Record<ServiceSlideType, { iconName: string; label: string; color: string }> = {
  lyric:          { iconName: 'Music',        label: 'Lyric',        color: '#6EC9FF' },
  scripture:      { iconName: 'BookOpen',     label: 'Scripture',    color: '#E8C77A' },
  sting:          { iconName: 'Film',         label: 'Sting',        color: '#FF6B6B' },
  countdown:      { iconName: 'Timer',        label: 'Countdown',    color: '#A78BFA' },
  announcement:   { iconName: 'Megaphone',    label: 'Announcement', color: '#34D399' },
  prayer_point:   { iconName: 'HandHeart',    label: 'Prayer',       color: '#F0ABFC' },
  sermon_outline: { iconName: 'AlignLeft',    label: 'Sermon',       color: '#FCD34D' },
  slideshow:      { iconName: 'Image',        label: 'Slideshow',    color: '#38BDF8' },
  blank:          { iconName: 'Square',       label: 'Blank',        color: '#475569' },
  break:          { iconName: 'Coffee',       label: 'Break',        color: '#94A3B8' },
};

// ─── Template definitions ──────────────────────────────────────────────────────
// NB: countdown slides use durationMs; endTime is set at load-time
export type TemplateSlide = Partial<AnyServiceSlide> & { durationMs?: number };

export const SERVICE_TEMPLATES: { id: string; name: string; icon: string; description: string; slides: TemplateSlide[] }[] = [
  {
    id: 'sunday_morning',
    name: 'Sunday Morning Service',
    icon: 'Sun',
    description: 'Full Sunday service: opener, worship, message, and close',
    slides: [
      { type: 'countdown', title: 'Pre-Service Countdown', message: 'Service begins soon…', durationMs: 600_000 },
      { type: 'sting',     title: 'Opening Sting',         style: 'opening' },
      { type: 'announcement', title: 'Welcome',            body: 'Welcome to [Church Name]! We are glad you are here.' },
      { type: 'lyric',    title: 'Worship Set — Slide 1' },
      { type: 'lyric',    title: 'Worship Set — Slide 2' },
      { type: 'prayer_point', title: 'Opening Prayer',     points: ['Thanksgiving', 'Holy Spirit come', 'Open our hearts'] },
      { type: 'scripture', title: 'Main Text' },
      { type: 'sermon_outline', title: 'Message Outline',  topic: 'Message Title', points: [{ heading: 'Point 1', scripture: 'John 1:1' }, { heading: 'Point 2' }, { heading: 'Point 3', scripture: 'Romans 12:2' }] },
      { type: 'announcement', title: 'Giving',             body: 'You can give via [method]. Thank you for your generosity!' },
      { type: 'lyric',    title: 'Closing Worship' },
      { type: 'sting',    title: 'Closing Bumper',         style: 'closing' },
      { type: 'break',    title: 'End of Service' },
    ],
  },
  {
    id: 'prayer_night',
    name: 'Prayer Night',
    icon: 'Moon',
    description: 'Intimate prayer gathering with structured prayer points',
    slides: [
      { type: 'countdown', title: 'Gathering — Starts In', message: 'Come in and be seated…', durationMs: 300_000 },
      { type: 'prayer_point', title: 'Praise & Worship',   points: ['Enter His gates with thanksgiving', 'Magnify the Lord', 'Let His presence fill the room'] },
      { type: 'prayer_point', title: 'Intercession',       points: ['Government & Nation', 'The Church', 'The Sick & Suffering', 'The Unsaved'] },
      { type: 'scripture', title: 'Scripture Meditation' },
      { type: 'prayer_point', title: 'Personal Prayer',    points: ['Quiet before God', 'Write what God is saying', 'Pray in the Spirit'] },
    ],
  },
  {
    id: 'youth_service',
    name: 'Youth & Young Adults',
    icon: 'Zap',
    description: 'High-energy youth service format',
    slides: [
      { type: 'countdown',    title: 'Doors Open',         message: 'Get ready to worship!', durationMs: 300_000 },
      { type: 'sting',        title: 'Hype Intro',         style: 'opening' },
      { type: 'announcement', title: "Tonight's Program",  body: 'Worship · Game · Message · Altar Call' },
      { type: 'lyric',        title: 'Set 1' },
      { type: 'lyric',        title: 'Set 2' },
      { type: 'sermon_outline', title: 'Talk',             topic: 'Identity in Christ', points: [{ heading: 'You are chosen' }, { heading: 'You are called' }, { heading: 'You are equipped' }] },
      { type: 'prayer_point', title: 'Altar Call',         points: ['Give your life to Jesus', 'Rededication', 'Prayer for baptism'] },
      { type: 'sting',        title: 'Close',              style: 'bumper' },
    ],
  },
];

// ─── Helper: materialise a template into live AnyServiceSlide[] ───────────────
export function instantiateTemplate(templateId: string): AnyServiceSlide[] {
  const t = SERVICE_TEMPLATES.find(x => x.id === templateId);
  if (!t) return [];
  const now = Date.now();
  return t.slides.map((s, i) => {
    const base = { id: `svc-${now}-${i}`, title: s.title || SLIDE_TYPE_META[s.type as ServiceSlideType]?.label || 'Slide' };
    if (s.type === 'countdown') {
      const durMs = (s as any).durationMs ?? 600_000;
      return { ...s, ...base, endTime: now + durMs } as AnyServiceSlide;
    }
    return { ...s, ...base } as AnyServiceSlide;
  });
}

// ─── Custom Presets ────────────────────────────────────────────────────────
export interface CustomTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  slides: TemplateSlide[];
}

export function saveCustomTemplate(name: string, slides: AnyServiceSlide[]) {
  if (typeof window === 'undefined') return;
  const custom = getCustomTemplates();
  custom.push({
    id: `custom_${Date.now()}`,
    name,
    icon: 'LayoutTemplate',
    description: 'User saved preset',
    slides: slides.map(s => {
      // Strip out the generated unique IDs and run-time endTime
      const { id, endTime, ...rest } = s as any;
      return rest;
    })
  });
  localStorage.setItem('sanctuary_custom_templates', JSON.stringify(custom));
}

export function getCustomTemplates(): CustomTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('sanctuary_custom_templates') || '[]');
  } catch {
    return [];
  }
}

