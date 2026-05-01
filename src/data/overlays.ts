// Media overlays: CSS-animated and image-based overlays for projection depth

export interface MediaOverlay {
  id: string;
  label: string;
  category: 'atmospheric' | 'liturgical' | 'abstract' | 'seasonal';
  type: 'css' | 'image' | 'video';
  cssClass?: string;       // Tailwind / custom CSS class added to the overlay div
  imageSrc?: string;       // Public path or external URL
  blendMode: string;       // CSS mix-blend-mode value
  opacity: number;         // 0–100
  icon: string;
}

export const mediaOverlays: MediaOverlay[] = [
  // Atmospheric
  { id: 'light_rays',   label: 'Light Rays',     category: 'atmospheric', type: 'css',   cssClass: 'overlay-light-rays',  blendMode: 'screen',  opacity: 60,  icon: 'Sun' },
  { id: 'soft_bokeh',   label: 'Soft Bokeh',      category: 'atmospheric', type: 'image', imageSrc: 'https://images.unsplash.com/photo-1518655048521-f130df041f66?w=1920&q=60', blendMode: 'screen', opacity: 40, icon: 'Star' },
  { id: 'smoke',        label: 'Haze & Smoke',    category: 'atmospheric', type: 'image', imageSrc: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=1920&q=60', blendMode: 'screen', opacity: 35, icon: 'CloudFog' },
  { id: 'deep_stars',   label: 'Starfield',       category: 'atmospheric', type: 'image', imageSrc: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&q=60', blendMode: 'screen', opacity: 50, icon: 'Sparkles' },
  // Liturgical
  { id: 'cross_light',  label: 'Cross of Light',  category: 'liturgical',  type: 'css',   cssClass: 'overlay-cross',       blendMode: 'overlay', opacity: 30,  icon: 'Plus' },
  { id: 'doves',        label: 'Ascending Light',  category: 'liturgical',  type: 'image', imageSrc: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1920&q=60', blendMode: 'screen', opacity: 25, icon: 'Wind' },
  { id: 'golden_dust',  label: 'Golden Particles', category: 'liturgical',  type: 'css',   cssClass: 'overlay-particles',   blendMode: 'screen',  opacity: 50,  icon: 'Zap' },
  // Abstract
  { id: 'color_wash',   label: 'Color Wash',      category: 'abstract',    type: 'css',   cssClass: 'overlay-color-wash',  blendMode: 'color',   opacity: 40,  icon: 'Palette' },
  { id: 'noise_grain',  label: 'Film Grain',       category: 'abstract',    type: 'css',   cssClass: 'overlay-noise',       blendMode: 'overlay', opacity: 25,  icon: 'Film' },
  { id: 'vignette',     label: 'Cinematic Edge',   category: 'abstract',    type: 'css',   cssClass: 'overlay-vignette',    blendMode: 'multiply',opacity: 70,  icon: 'Square' },
  // Seasonal
  { id: 'christmas',    label: 'Christmas Snow',   category: 'seasonal',    type: 'image', imageSrc: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=1920&q=60', blendMode: 'screen', opacity: 30, icon: 'Snowflake' },
  { id: 'easter',       label: 'Spring Bloom',     category: 'seasonal',    type: 'image', imageSrc: 'https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=1920&q=60', blendMode: 'screen', opacity: 35, icon: 'Flower' },
];

export const lowerThirdStyles = [
  { id: 'classic',       label: 'Classic Bar',      description: 'Solid bar with accent line' },
  { id: 'gradient',      label: 'Gradient Fade',    description: 'Fades left-to-right' },
  { id: 'pill',          label: 'Pill Badge',        description: 'Rounded compact badge' },
  { id: 'cinematic',     label: 'Cinematic Title',  description: 'Broadcast news style' },
  { id: 'minimal',       label: 'Minimal Dot',      description: 'Ultra-clean minimal' },
  { id: 'bold_left',     label: 'Bold Left Block',  description: 'Big colored left block' },
];

export const textPositions = [
  { id: 'top-left',     label: 'Top Left',     justify: 'justify-start',  align: 'items-start',  pt: 'pt-12', pb: '', px: 'px-12' },
  { id: 'top-center',   label: 'Top Center',   justify: 'justify-center', align: 'items-start',  pt: 'pt-12', pb: '', px: 'px-12' },
  { id: 'top-right',    label: 'Top Right',    justify: 'justify-end',    align: 'items-start',  pt: 'pt-12', pb: '', px: 'px-12' },
  { id: 'mid-left',     label: 'Mid Left',     justify: 'justify-start',  align: 'items-center', pt: '',      pb: '', px: 'px-12' },
  { id: 'center',       label: 'Center',       justify: 'justify-center', align: 'items-center', pt: '',      pb: '', px: 'px-12' },
  { id: 'mid-right',    label: 'Mid Right',    justify: 'justify-end',    align: 'items-center', pt: '',      pb: '', px: 'px-12' },
  { id: 'bot-left',     label: 'Bot Left',     justify: 'justify-start',  align: 'items-end',    pt: '',      pb: 'pb-16', px: 'px-12' },
  { id: 'bot-center',   label: 'Bot Center',   justify: 'justify-center', align: 'items-end',    pt: '',      pb: 'pb-16', px: 'px-12' },
  { id: 'bot-right',    label: 'Bot Right',    justify: 'justify-end',    align: 'items-end',    pt: '',      pb: 'pb-16', px: 'px-12' },
];

export const textStylePresets = [
  { id: 'clean_white',   label: 'Clean White',   textColor: 'text-white',       shadow: 'drop-shadow-2xl',           fontStyle: 'font-black' },
  { id: 'halo_gold',     label: 'Halo Gold',     textColor: 'text-halo',        shadow: 'drop-shadow-[0_0_20px_rgba(232,199,122,0.6)]', fontStyle: 'font-bold' },
  { id: 'atmos_glow',    label: 'Atmos Glow',    textColor: 'text-atmos',       shadow: 'drop-shadow-[0_0_30px_rgba(110,201,255,0.8)]', fontStyle: 'font-bold' },
  { id: 'luma_white',    label: 'Luma White',    textColor: 'text-luma',        shadow: 'drop-shadow-xl',            fontStyle: 'font-medium' },
  { id: 'ultra_outline', label: 'Outlined',      textColor: 'text-white',       shadow: 'drop-shadow-2xl [text-shadow:_0_0_0_2px_black]', fontStyle: 'font-black' },
];

export const fontSizes = [
  { id: 'xs', label: 'XS', class: 'text-2xl' },
  { id: 'sm', label: 'S',  class: 'text-4xl' },
  { id: 'md', label: 'M',  class: 'text-6xl' },
  { id: 'lg', label: 'L',  class: 'text-8xl' },
  { id: 'xl', label: 'XL', class: 'text-9xl' },
];
